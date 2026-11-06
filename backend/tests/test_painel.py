"""Painel do dono: agenda do dia e cadastro de serviços."""
import threading

import pytest

from conftest import QUARTA, TERCA, agendar, novo_cliente


def servico(nome="Pigmentação", descricao="Cobre falhas da barba.", duracao=45, ativo=True):
    return {"nome": nome, "descricao": descricao, "duracaoMin": duracao, "ativo": ativo}


@pytest.mark.parametrize(
    ("metodo", "caminho"),
    [
        ("get", "/api/painel/agenda?data=2026-11-10"),
        ("get", "/api/painel/servicos"),
        ("post", "/api/painel/servicos"),
        ("put", "/api/painel/servicos/corte"),
    ],
)
def test_so_o_dono_acessa(anonimo, cliente, metodo, caminho):
    kwargs = {"json": servico()} if metodo != "get" else {}
    assert getattr(anonimo, metodo)(caminho, **kwargs).status_code == 401
    r = getattr(cliente, metodo)(caminho, **kwargs)
    assert r.status_code == 403
    assert r.json()["detail"] == "Esta área é exclusiva da administração da barbearia."


def test_agenda_do_dia(dono, cliente, outro_cliente):
    agendar(cliente, hora="15:00")
    id_ = agendar(outro_cliente, hora="11:00", telefone="(21) 91111-2222", nome="Outra Pessoa").json()["id"]
    agendar(cliente, hora="10:00", data=QUARTA)
    outro_cliente.post(f"/api/agendamentos/{id_}/cancelar")

    agenda = dono.get("/api/painel/agenda", params={"data": TERCA.isoformat()}).json()
    assert [(a["hora"], a["status"]) for a in agenda] == [("11:00", "cancelado"), ("15:00", "confirmado")]
    assert agenda[0]["cliente"]["nome"] == "Outra Pessoa" and agenda[0]["canceladoPor"] == "cliente"
    assert "canceladoPor" not in agenda[1]

    assert dono.get("/api/painel/agenda").status_code == 422


def test_lista_inclui_inativos(dono, anonimo):
    dono.put("/api/painel/servicos/barba", json=servico("Barba", ativo=False, duracao=30))
    assert [s["id"] for s in dono.get("/api/painel/servicos").json()] == ["corte", "barba", "corte-barba"]
    assert [s["id"] for s in anonimo.get("/api/servicos").json()] == ["corte", "corte-barba"]


def test_cria_servico(dono, anonimo):
    r = dono.post("/api/painel/servicos", json=servico("  Pigmentação  "))
    assert r.status_code == 201
    assert r.json() == {
        "id": "pigmentacao",
        "nome": "Pigmentação",
        "descricao": "Cobre falhas da barba.",
        "duracaoMin": 45,
        "ativo": True,
    }
    assert anonimo.get("/api/servicos").json()[-1]["id"] == "pigmentacao"  # entra no fim


def test_id_nao_repete(dono):
    assert dono.post("/api/painel/servicos", json=servico("Corte!")).json()["id"] == "corte-2"
    assert dono.post("/api/painel/servicos", json=servico("Corte?")).json()["id"] == "corte-3"
    assert dono.post("/api/painel/servicos", json=servico("++")).json()["id"] == "servico"


def test_nome_repetido(dono):
    r = dono.post("/api/painel/servicos", json=servico(" CORTE "))
    assert r.status_code == 409 and r.json()["detail"] == "Já existe um serviço com esse nome."
    r = dono.put("/api/painel/servicos/barba", json=servico("corte"))
    assert r.status_code == 409


@pytest.mark.parametrize(
    ("dados", "mensagem"),
    [
        (servico(nome="A"), "Informe o nome do serviço."),
        (servico(nome="A" * 41), "O nome pode ter no máximo 40 caracteres."),
        (servico(descricao="abc"), "Escreva uma descrição curta."),
        (servico(descricao="a" * 121), "A descrição pode ter no máximo 120 caracteres."),
        (servico(duracao=20), "Duração inválida."),
    ],
)
def test_validacoes_do_servico(dono, dados, mensagem):
    r = dono.post("/api/painel/servicos", json=dados)
    assert r.status_code == 422 and r.json()["detail"] == mensagem


def test_editar_mantem_id_e_historico(dono, cliente):
    agendar(cliente, hora="10:00")
    r = dono.put("/api/painel/servicos/corte", json=servico("Corte Social", duracao=60))
    assert r.status_code == 200
    assert r.json()["id"] == "corte" and r.json()["nome"] == "Corte Social"

    antigo = cliente.get("/api/agendamentos/meus").json()[0]
    assert antigo["servicoNome"] == "Corte" and antigo["duracaoMin"] == 30
    # Mudar só maiúsculas do próprio nome não é "nome repetido".
    assert dono.put("/api/painel/servicos/corte", json=servico("CORTE SOCIAL")).status_code == 200


def test_editar_inexistente(dono):
    r = dono.put("/api/painel/servicos/nao-existe", json=servico())
    assert r.status_code == 404 and r.json()["detail"] == "Serviço não encontrado."


def test_desativar_some_dos_horarios(dono, anonimo):
    dono.put("/api/painel/servicos/barba", json=servico("Barba", duracao=30, ativo=False))
    r = anonimo.get("/api/horarios", params={"data": TERCA.isoformat(), "servico": "barba"})
    assert r.json() == []


def test_mesmo_nome_salvo_ao_mesmo_tempo(dono):
    largada = threading.Barrier(6)
    resultados = []

    def tentar():
        c = novo_cliente()
        c.cookies = dono.cookies
        largada.wait()
        resultados.append(c.post("/api/painel/servicos", json=servico("Hidratação")).status_code)

    threads = [threading.Thread(target=tentar) for _ in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(resultados) == [201] + [409] * 5
