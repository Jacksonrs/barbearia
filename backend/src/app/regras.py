"""Regras de agenda: horários livres, conflito entre agendamentos e cancelamento.

Mesma lógica que o frontend simulava em frontend/src/services/agendamentoApi.ts.
"""
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .models import Agendamento, Barbeiro, Expediente, Servico
from .utils import dia_semana, hora_para_minutos, minutos_para_hora


def inicio_agendamento(data: date, hora: str) -> datetime:
    minutos = hora_para_minutos(hora)
    return datetime(data.year, data.month, data.day, minutos // 60, minutos % 60, tzinfo=config.FUSO)


def expediente_do_dia(db: Session, data: date) -> tuple[int, int] | None:
    exp = db.get(Expediente, dia_semana(data))
    if not exp or exp.abre_min is None or exp.fecha_min is None:
        return None
    return exp.abre_min, exp.fecha_min


def data_no_periodo(data: date, agora: datetime) -> bool:
    hoje = agora.date()
    return hoje <= data < hoje + timedelta(days=config.DIAS_AGENDAMENTO)


def candidatos(db: Session, barbeiro_id: str) -> list[str]:
    """Barbeiros que podem atender: todos (sem preferência) ou só o escolhido."""
    if barbeiro_id == config.SEM_PREFERENCIA:
        return list(db.scalars(select(Barbeiro.id).order_by(Barbeiro.ordem, Barbeiro.nome)))
    return [barbeiro_id] if db.get(Barbeiro, barbeiro_id) else []


def ocupacao_do_dia(db: Session, data: date) -> dict[str, list[tuple[int, int]]]:
    """Intervalos ocupados (início, fim em minutos) de cada barbeiro no dia."""
    ocupado: dict[str, list[tuple[int, int]]] = {}
    consulta = select(Agendamento).where(
        Agendamento.data == data, Agendamento.status == "confirmado"
    )
    for a in db.scalars(consulta):
        inicio = hora_para_minutos(a.hora)
        ocupado.setdefault(a.barbeiro_id, []).append((inicio, inicio + a.duracao_min))
    return ocupado


def livre(intervalos: list[tuple[int, int]], inicio: int, duracao: int) -> bool:
    fim = inicio + duracao
    return not any(inicio < fim_outro and inicio_outro < fim for inicio_outro, fim_outro in intervalos)


def listar_horarios(
    db: Session, data: date, servico: Servico, barbeiro_id: str, agora: datetime
) -> list[tuple[str, bool]]:
    expediente = expediente_do_dia(db, data)
    if not expediente or not data_no_periodo(data, agora):
        return []

    abre, fecha = expediente
    ids = candidatos(db, barbeiro_id)
    ocupado = ocupacao_do_dia(db, data)
    limite = agora + timedelta(minutes=config.ANTECEDENCIA_AGENDAR_MIN)

    horarios = []
    m = abre
    while m + servico.duracao_min <= fecha:
        hora = minutos_para_hora(m)
        disponivel = inicio_agendamento(data, hora) >= limite and any(
            livre(ocupado.get(i, []), m, servico.duracao_min) for i in ids
        )
        horarios.append((hora, disponivel))
        m += config.INTERVALO_MIN
    return horarios


def primeiro_barbeiro_livre(
    db: Session, data: date, hora: str, duracao: int, barbeiro_id: str
) -> str | None:
    ocupado = ocupacao_do_dia(db, data)
    inicio = hora_para_minutos(hora)
    return next(
        (i for i in candidatos(db, barbeiro_id) if livre(ocupado.get(i, []), inicio, duracao)),
        None,
    )


def cliente_pode_cancelar(agendamento: Agendamento, agora: datetime) -> bool:
    return agendamento.status == "confirmado" and inicio_agendamento(
        agendamento.data, agendamento.hora
    ) - agora >= timedelta(minutes=config.ANTECEDENCIA_CANCELAMENTO_MIN)
