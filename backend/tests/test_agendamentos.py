"""Criar, listar e cancelar agendamentos (regras de horário e de permissão)."""
import threading
import uuid
from datetime import datetime, timedelta

from app import config
from app.models import Agendamento, Usuario
from app.seguranca import _hash_token
from app.models import Sessao
from app.utils import agora_utc
from conftest import DOMINGO, QUARTA, TERCA, agendar, novo_cliente


def test_precisa_de_login(anonimo):
    r = agendar(anonimo)
    assert r.status_code == 401
    assert anonimo.get("/api/agendamentos/meus").status_code == 401
    assert anonimo.post("/api/agendamentos/JR-000000/cancelar").status_code == 401


def test_cria_agendamento(cliente):
    r = agendar(cliente, hora="10:00", observacao="  Degradê  ", email="Cli@Ex.com")
    assert r.status_code == 201, r.text
    a = r.json()
    assert a["id"].startswith("JR-") and len(a["id"]) == 9
    assert a["clienteId"] == cliente.usuario["id"]
    assert a["servicoId"] == "corte" and a["servicoNome"] == "Corte" and a["duracaoMin"] == 30
    assert a["barbeiroId"] == "junior"
    assert a["data"] == "2026-11-10" and a["hora"] == "10:00"
    assert a["status"] == "confirmado"
    assert "canceladoPor" not in a  # o tipo do front é opcional
    assert a["cliente"]["observacao"] == "Degradê"
    # Data com fuso, que o `new Date()` do navegador entende.
    assert datetime.fromisoformat(a["criadoEm"]).utcoffset() == timedelta(0)


def test_mesmo_horario_mesmo_barbeiro(cliente, outro_cliente):
    assert agendar(cliente, hora="10:00").status_code == 201
    r = agendar(outro_cliente, hora="10:00")
    assert r.status_code == 409
    assert r.json()["detail"] == "Esse horário acabou de ser ocupado. Escolha outro horário."


def test_sobreposicao_parcial(cliente):
    assert agendar(cliente, hora="10:00", servico="corte-barba").status_code == 201
    assert agendar(cliente, hora="10:30").status_code == 409
    assert agendar(cliente, hora="09:30", servico="corte-barba").status_code == 409
    assert agendar(cliente, hora="11:00").status_code == 201
    assert agendar(cliente, hora="09:30").status_code == 201


def test_sem_preferencia_escolhe_na_ordem(cliente):
    ids = [agendar(cliente, hora="10:00", barbeiro="sem-preferencia").json()["barbeiroId"] for _ in range(3)]
    assert ids == ["junior", "rafael", "lucas"]
    r = agendar(cliente, hora="10:00", barbeiro="sem-preferencia")
    assert r.status_code == 409


def test_sem_preferencia_pula_quem_esta_ocupado(cliente):
    agendar(cliente, hora="10:00", barbeiro="junior")
    assert agendar(cliente, hora="10:00", barbeiro="sem-preferencia").json()["barbeiroId"] == "rafael"


def test_horario_fora_da_grade(cliente):
    for hora in ("10:15", "08:30", "18:45", "19:00"):
        r = agendar(cliente, hora=hora)
        assert r.status_code == 400, hora
        assert r.json()["detail"] == "Horário inválido."
    # Serviço de 60 min às 18:30 passaria do fechamento.
    assert agendar(cliente, hora="18:30", servico="corte-barba").status_code == 400


def test_hora_mal_formatada(cliente):
    for hora in ("25:00", "9:00", "10h", ""):
        r = agendar(cliente, hora=hora)
        assert r.status_code == 422, hora
        assert r.json()["erros"] == {"hora": "Horário inválido."}


def test_dados_do_cliente_validados(cliente):
    r = agendar(cliente, telefone="1234")
    assert r.status_code == 422
    assert r.json()["erros"] == {"cliente.telefone": "Telefone incompleto. Inclua o DDD."}
    r = agendar(cliente, observacao="x" * 201)
    assert r.json()["detail"] == "A observação pode ter no máximo 200 caracteres."


def test_dia_fechado_e_periodo(cliente):
    r = agendar(cliente, data=DOMINGO)
    assert r.status_code == 400 and r.json()["detail"] == "A barbearia não abre neste dia."
    r = agendar(cliente, data=TERCA + timedelta(days=14))
    assert r.status_code == 400 and r.json()["detail"] == "Data fora do período de agendamento."
    r = agendar(cliente, data=TERCA - timedelta(days=7))
    assert r.status_code == 400 and r.json()["detail"] == "Data fora do período de agendamento."
    assert agendar(cliente, data=TERCA + timedelta(days=11)).status_code == 201  # sábado, último dia aberto


def test_antecedencia_minima(cliente, relogio):
    relogio.ir_para(TERCA, "10:01")
    r = agendar(cliente, hora="10:30")
    assert r.status_code == 409
    assert r.json()["detail"] == "Esse horário não está mais disponível. Escolha outro horário."
    assert agendar(cliente, hora="11:00").status_code == 201
    relogio.ir_para(TERCA, "11:00")
    assert agendar(cliente, hora="11:30", barbeiro="rafael").status_code == 201  # exatos 30 min


def test_servico_e_barbeiro_invalidos(cliente, dono):
    r = agendar(cliente, servico="nao-existe")
    assert r.status_code == 400 and r.json()["detail"] == "Este serviço não está mais disponível."
    r = agendar(cliente, barbeiro="nao-existe")
    assert r.status_code == 400 and r.json()["detail"] == "Barbeiro não encontrado."

    dono.put(
        "/api/painel/servicos/barba",
        json={"nome": "Barba", "descricao": "Toalha quente.", "duracaoMin": 30, "ativo": False},
    )
    assert agendar(cliente, servico="barba").status_code == 400


def test_meus_so_do_proprio_cliente_e_em_ordem(cliente, outro_cliente):
    agendar(cliente, hora="15:00")
    agendar(cliente, hora="09:00", data=QUARTA)
    agendar(cliente, hora="10:00")
    agendar(outro_cliente, hora="11:00")
    meus = cliente.get("/api/agendamentos/meus").json()
    assert [(a["data"], a["hora"]) for a in meus] == [
        ("2026-11-10", "10:00"),
        ("2026-11-10", "15:00"),
        ("2026-11-11", "09:00"),
    ]
    assert len(outro_cliente.get("/api/agendamentos/meus").json()) == 1


# ---------- cancelamento ----------


def cancelar(c, id_):
    return c.post(f"/api/agendamentos/{id_}/cancelar")


def test_cliente_cancela_e_libera_o_horario(cliente, outro_cliente):
    id_ = agendar(cliente, hora="14:00").json()["id"]
    assert cancelar(cliente, id_).status_code == 204
    a = cliente.get("/api/agendamentos/meus").json()[0]
    assert a["status"] == "cancelado" and a["canceladoPor"] == "cliente"
    assert agendar(outro_cliente, hora="14:00").status_code == 201

    r = cancelar(cliente, id_)
    assert r.status_code == 409 and r.json()["detail"] == "Este agendamento já foi cancelado."


def test_cliente_nao_ve_agendamento_de_outro(cliente, outro_cliente):
    id_ = agendar(cliente, hora="14:00").json()["id"]
    r = cancelar(outro_cliente, id_)
    assert r.status_code == 404 and r.json()["detail"] == "Agendamento não encontrado."
    assert cancelar(cliente, "JR-XXXXXX").status_code == 404
    assert cliente.get("/api/agendamentos/meus").json()[0]["status"] == "confirmado"


def test_prazo_de_cancelamento_do_cliente(cliente, relogio):
    id_ = agendar(cliente, hora="14:00").json()["id"]
    relogio.ir_para(TERCA, "12:01")
    r = cancelar(cliente, id_)
    assert r.status_code == 400
    assert r.json()["detail"] == "O cancelamento só pode ser feito até 2 horas antes do horário."
    relogio.ir_para(TERCA, "12:00")
    assert cancelar(cliente, id_).status_code == 204


def test_dono_cancela_qualquer_um_a_qualquer_hora(cliente, dono, relogio):
    id_ = agendar(cliente, hora="14:00").json()["id"]
    relogio.ir_para(TERCA, "13:50")
    assert cancelar(dono, id_).status_code == 204
    a = cliente.get("/api/agendamentos/meus").json()[0]
    assert a["canceladoPor"] == "dono"


def test_conta_google_ganha_o_telefone_do_primeiro_agendamento(db, cliente):
    usuario = Usuario(
        id=str(uuid.uuid4()), nome="Ana", email="ana@gmail.com", papel="cliente",
        provedor="google", google_sub="g1", criado_em=agora_utc(),
    )
    db.add(usuario)
    db.add(Sessao(token_hash=_hash_token("tk-ana"), usuario_id=usuario.id, expira_em=agora_utc() + timedelta(days=1)))
    db.commit()
    c = novo_cliente()
    c.cookies.set(config.COOKIE_SESSAO, "tk-ana")

    # Telefone já usado por outra conta: não copia.
    assert agendar(c, hora="09:00", telefone="(11) 98765-4321").status_code == 201
    assert c.get("/api/auth/eu").json()["telefone"] == ""

    assert agendar(c, hora="10:00", telefone="(31) 97777-6666").status_code == 201
    assert c.get("/api/auth/eu").json()["telefone"] == "(31) 97777-6666"


def test_dois_clientes_no_mesmo_horario_ao_mesmo_tempo(fabrica_db):
    clientes = []
    for i in range(8):
        c = novo_cliente()
        c.post(
            "/api/auth/cadastro",
            json={"nome": f"Cliente {i}", "telefone": f"119876543{i:02d}", "email": "", "senha": "segredo1"},
        )
        clientes.append(c)

    largada = threading.Barrier(len(clientes))
    resultados = []

    def tentar(c):
        largada.wait()
        resultados.append(agendar(c, hora="16:00", barbeiro="sem-preferencia").status_code)

    threads = [threading.Thread(target=tentar, args=(c,)) for c in clientes]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert sorted(resultados) == [201] * 3 + [409] * 5
    with fabrica_db() as db:
        barbeiros = sorted(a.barbeiro_id for a in db.query(Agendamento).filter_by(hora="16:00"))
    assert barbeiros == ["junior", "lucas", "rafael"]
