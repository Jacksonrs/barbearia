"""Rotas abertas: serviços, barbeiros, funcionamento e horários livres."""
from datetime import timedelta

from conftest import DOMINGO, QUARTA, SEGUNDA, TERCA, agendar


def horas(resposta, so_disponiveis=True):
    return [h["hora"] for h in resposta.json() if h["disponivel"] or not so_disponiveis]


def buscar(c, data=TERCA, servico="corte", barbeiro="junior"):
    return c.get("/api/horarios", params={"data": data.isoformat(), "servico": servico, "barbeiro": barbeiro})


def test_servicos_ativos_em_camel_case(anonimo):
    r = anonimo.get("/api/servicos")
    assert r.status_code == 200
    assert [s["id"] for s in r.json()] == ["corte", "barba", "corte-barba"]
    assert r.json()[0] == {
        "id": "corte",
        "nome": "Corte",
        "descricao": "Na tesoura ou na máquina, com acabamento na navalha.",
        "duracaoMin": 30,
        "ativo": True,
    }


def test_barbeiros(anonimo):
    r = anonimo.get("/api/barbeiros")
    assert r.status_code == 200
    assert [b["id"] for b in r.json()] == ["junior", "rafael", "lucas"]
    assert set(r.json()[0]) == {"id", "nome", "especialidade"}


def test_funcionamento(anonimo):
    r = anonimo.get("/api/funcionamento")
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["intervaloMin"] == 30
    assert corpo["diasAgendamento"] == 14
    assert corpo["dias"][0] is None and corpo["dias"][1] is None  # domingo e segunda
    assert corpo["dias"][2] == {"abre": "09:00", "fecha": "19:00"}
    assert corpo["dias"][6] == {"abre": "08:00", "fecha": "16:00"}


def test_grade_de_horarios_do_dia(anonimo):
    r = buscar(anonimo)
    assert r.status_code == 200
    todas = horas(r, so_disponiveis=False)
    assert todas[0] == "09:00" and todas[-1] == "18:30"  # serviço de 30 min termina às 19:00
    assert len(todas) == 20
    assert all(h["disponivel"] for h in r.json())


def test_servico_longo_nao_passa_do_fechamento(anonimo):
    assert horas(buscar(anonimo, servico="corte-barba"), so_disponiveis=False)[-1] == "18:00"


def test_respeita_antecedencia_minima(anonimo, relogio):
    relogio.ir_para(TERCA, "10:00")
    livres = horas(buscar(anonimo))
    assert "10:00" not in livres
    assert livres[0] == "10:30"  # exatamente 30 min depois ainda pode


def test_dias_sem_horario(anonimo):
    assert buscar(anonimo, data=DOMINGO).json() == []
    assert buscar(anonimo, data=SEGUNDA).json() == []
    assert buscar(anonimo, data=TERCA - timedelta(days=7)).json() == []  # passado
    assert buscar(anonimo, data=TERCA + timedelta(days=14)).json() == []  # fora dos 14 dias
    assert buscar(anonimo, data=TERCA + timedelta(days=7)).json() != []


def test_servico_inexistente_ou_barbeiro_inexistente(anonimo):
    assert buscar(anonimo, servico="nao-existe").json() == []
    assert horas(buscar(anonimo, barbeiro="nao-existe")) == []


def test_parametros_invalidos_viram_422_com_frase(anonimo):
    r = anonimo.get("/api/horarios", params={"data": "amanha", "servico": "corte"})
    assert r.status_code == 422
    assert r.json()["detail"] == "Valor inválido."
    assert "data" in r.json()["erros"]


def test_horario_ocupado_e_sem_preferencia(cliente, anonimo):
    assert agendar(cliente, hora="10:00", barbeiro="junior").status_code == 201
    assert "10:00" not in horas(buscar(anonimo, barbeiro="junior"))
    assert "10:00" in horas(buscar(anonimo, barbeiro="rafael"))
    assert "10:00" in horas(buscar(anonimo, barbeiro="sem-preferencia"))

    agendar(cliente, hora="10:00", barbeiro="rafael")
    agendar(cliente, hora="10:00", barbeiro="lucas")
    assert "10:00" not in horas(buscar(anonimo, barbeiro="sem-preferencia"))


def test_servico_longo_bloqueia_horarios_seguintes(cliente, anonimo):
    agendar(cliente, hora="10:00", servico="corte-barba", barbeiro="junior")
    livres = horas(buscar(anonimo, barbeiro="junior"))
    assert "10:00" not in livres and "10:30" not in livres
    assert "09:30" in livres and "11:00" in livres
    # Um serviço de 60 min às 09:30 encostaria no das 10:00.
    assert "09:30" not in horas(buscar(anonimo, servico="corte-barba", barbeiro="junior"))


def test_outro_dia_nao_interfere(cliente, anonimo):
    agendar(cliente, hora="10:00", barbeiro="junior")
    assert "10:00" in horas(buscar(anonimo, data=QUARTA, barbeiro="junior"))
