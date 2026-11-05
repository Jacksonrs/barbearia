"""Rotas abertas (sem login): a página inicial também lista os serviços."""
from datetime import date

from fastapi import APIRouter, Query
from sqlalchemy import select

from .. import config
from ..conversores import servico_saida
from ..dependencias import DB, Agora
from ..models import Barbeiro, Expediente, Servico
from ..regras import listar_horarios
from ..schemas import BarbeiroSaida, DiaFuncionamento, Funcionamento, HorarioSaida, ServicoSaida
from ..utils import minutos_para_hora

rota = APIRouter(prefix="/api", tags=["público"])


@rota.get("/servicos", response_model=list[ServicoSaida])
def servicos_ativos(db: DB):
    consulta = select(Servico).where(Servico.ativo).order_by(Servico.ordem)
    return [servico_saida(s) for s in db.scalars(consulta)]


@rota.get("/barbeiros", response_model=list[BarbeiroSaida])
def barbeiros(db: DB):
    consulta = select(Barbeiro).order_by(Barbeiro.ordem, Barbeiro.nome)
    return [
        BarbeiroSaida(id=b.id, nome=b.nome, especialidade=b.especialidade)
        for b in db.scalars(consulta)
    ]


@rota.get("/funcionamento", response_model=Funcionamento)
def funcionamento(db: DB):
    """Novo (não estava no README do front): substitui o horário fixo em dadosExemplo.ts."""
    por_dia = {e.dia_semana: e for e in db.scalars(select(Expediente))}
    dias: list[DiaFuncionamento | None] = []
    for d in range(7):
        e = por_dia.get(d)
        if e and e.abre_min is not None and e.fecha_min is not None:
            dias.append(DiaFuncionamento(abre=minutos_para_hora(e.abre_min), fecha=minutos_para_hora(e.fecha_min)))
        else:
            dias.append(None)
    return Funcionamento(
        intervalo_min=config.INTERVALO_MIN,
        dias_agendamento=config.DIAS_AGENDAMENTO,
        dias=dias,
    )


@rota.get("/horarios", response_model=list[HorarioSaida])
def horarios(
    db: DB,
    agora: Agora,
    data: date,
    servico: str,
    barbeiro: str = Query(config.SEM_PREFERENCIA),
):
    s = db.get(Servico, servico)
    if not s or not s.ativo:
        return []
    return [
        HorarioSaida(hora=h, disponivel=d) for h, d in listar_horarios(db, data, s, barbeiro, agora)
    ]
