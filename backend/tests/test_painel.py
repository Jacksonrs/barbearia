"""Painel do dono: agenda do dia, cadastro de serviços e relatórios."""
import threading
from datetime import date

import pytest

from conftest import QUARTA, TERCA, agendar, novo_cliente

SEXTA = date(2026, 11, 13)


def servico(nome="Pigmentação", descricao="Cobre falhas da barba.", duracao=45, ativo=True, preco=5000):
    return {
        "nome": nome,
        "descricao": descricao,
        "duracaoMin": duracao,
        "precoCentavos": preco,
        "ativo": ativo,
    }


@pytest.mark.parametrize(
    ("metodo", "caminho"),
    [
        ("get", "/api/painel/agenda?data=2026-11-10"),
        ("get", "/api/painel/servicos"),
        ("post", "/api/painel/servicos"),
        ("put", "/api/painel/servicos/corte"),
        ("get", "/api/painel/relatorio?inicio=2026-11-01&fim=2026-11-30"),
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
        "precoCentavos": 5000,
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
        (servico(preco=-1), "Preço inválido."),
        (servico(preco=100_001), "Preço inválido."),
        (servico(preco=45.5), "Valor inválido."),
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


def test_preco_do_servico(dono, anonimo):
    assert {s["id"]: s["precoCentavos"] for s in anonimo.get("/api/servicos").json()} == {
        "corte": 4000,
        "barba": 3000,
        "corte-barba": 6500,
    }
    r = dono.put("/api/painel/servicos/corte", json=servico("Corte", duracao=30, preco=4500))
    assert r.status_code == 200 and r.json()["precoCentavos"] == 4500
    assert anonimo.get("/api/servicos").json()[0]["precoCentavos"] == 4500


def test_preco_e_opcional_para_clientes_antigos(dono):
    dados = servico("Sobrancelha")
    del dados["precoCentavos"]
    r = dono.post("/api/painel/servicos", json=dados)
    assert r.status_code == 201 and r.json()["precoCentavos"] == 0


# ---------- relatórios ----------


def relatorio(dono, inicio=TERCA, fim=QUARTA):
    r = dono.get("/api/painel/relatorio", params={"inicio": inicio.isoformat(), "fim": fim.isoformat()})
    assert r.status_code == 200, r.text
    return r.json()


def test_relatorio_vazio(dono):
    r = relatorio(dono)
    assert r["agendamentos"] == 0 and r["faturamentoCentavos"] == 0 and r["ticketMedioCentavos"] == 0
    assert r["porServico"] == [] and r["clientesFrequentes"] == []
    assert r["porDiaSemana"] == [0] * 7
    assert [d["data"] for d in r["porDia"]] == [TERCA.isoformat(), QUARTA.isoformat()]


def test_relatorio_do_periodo(dono, cliente, outro_cliente, relogio):
    agendar(cliente, hora="10:00", servico="corte", barbeiro="junior")  # R$ 40
    agendar(outro_cliente, hora="10:00", servico="barba", barbeiro="rafael",
            telefone="(21) 91111-2222", nome="Outra Pessoa")  # R$ 30
    agendar(cliente, hora="15:30", data=QUARTA, servico="corte-barba", barbeiro="junior")  # R$ 65
    cancelado = agendar(outro_cliente, hora="16:00", data=QUARTA, servico="corte", barbeiro="lucas",
                        telefone="(21) 91111-2222", nome="Outra Pessoa").json()["id"]
    outro_cliente.post(f"/api/agendamentos/{cancelado}/cancelar")
    # Fora do período: não entra.
    agendar(cliente, hora="10:00", data=SEXTA, servico="corte")

    relogio.ir_para(TERCA, "12:00")
    r = relatorio(dono)

    assert (r["agendamentos"], r["cancelados"], r["canceladosPeloCliente"]) == (3, 1, 1)
    assert r["faturamentoCentavos"] == 13500
    assert r["faturamentoRealizadoCentavos"] == 7000  # só os dois de terça já passaram
    assert r["ticketMedioCentavos"] == 4500
    assert (r["clientes"], r["clientesNovos"]) == (2, 2)

    assert [(s["id"], s["quantidade"], s["faturamentoCentavos"]) for s in r["porServico"]] == [
        ("corte-barba", 1, 6500),
        ("corte", 1, 4000),
        ("barba", 1, 3000),
    ]
    assert [(b["nome"], b["quantidade"]) for b in r["porBarbeiro"]] == [("Junior", 2), ("Rafael", 1)]
    assert r["porDiaSemana"] == [0, 0, 2, 1, 0, 0, 0]
    assert r["porHora"] == [{"hora": "10:00", "quantidade": 2}, {"hora": "15:00", "quantidade": 1}]
    assert [(d["quantidade"], d["faturamentoCentavos"]) for d in r["porDia"]] == [(2, 7000), (1, 6500)]
    assert [(c["nome"], c["quantidade"]) for c in r["clientesFrequentes"]] == [
        ("Cliente Teste", 2),
        ("Outra Pessoa", 1),
    ]


def test_relatorio_usa_o_preco_do_dia_do_agendamento(dono, cliente):
    agendar(cliente, servico="corte")
    dono.put("/api/painel/servicos/corte", json=servico("Corte clássico", duracao=30, preco=9900))
    r = relatorio(dono)
    assert r["faturamentoCentavos"] == 4000
    assert r["porServico"][0]["nome"] == "Corte clássico"  # nome atual do serviço


def test_cliente_que_ja_veio_antes_nao_e_novo(dono, cliente, outro_cliente):
    agendar(cliente, hora="10:00")
    agendar(cliente, hora="10:00", data=QUARTA)
    agendar(outro_cliente, hora="11:00", data=QUARTA, telefone="(21) 91111-2222", nome="Outra Pessoa")
    r = relatorio(dono, inicio=QUARTA, fim=QUARTA)
    assert (r["clientes"], r["clientesNovos"]) == (2, 1)


@pytest.mark.parametrize(
    ("inicio", "fim", "mensagem"),
    [
        ("2026-11-11", "2026-11-10", "A data final precisa ser igual ou depois da inicial."),
        ("2026-01-01", "2027-01-02", "Escolha um período de até 1 ano."),
    ],
)
def test_periodo_invalido(dono, inicio, fim, mensagem):
    r = dono.get("/api/painel/relatorio", params={"inicio": inicio, "fim": fim})
    assert r.status_code == 422 and r.json()["detail"] == mensagem
