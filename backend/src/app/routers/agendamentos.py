import secrets
import threading
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from .. import config
from ..conversores import agendamento_saida
from ..dependencias import DB, Agora, UsuarioLogado
from ..models import Agendamento, Barbeiro, Servico, Usuario
from ..regras import (
    cliente_pode_cancelar,
    data_no_periodo,
    expediente_do_dia,
    inicio_agendamento,
    listar_horarios,
    primeiro_barbeiro_livre,
)
from ..schemas import AgendamentoSaida, NovoAgendamento
from ..utils import agora_utc, digitos

rota = APIRouter(prefix="/api/agendamentos", tags=["agendamentos"])

# Evita que dois clientes peguem o mesmo horário ao mesmo tempo.
# Vale para UM processo do servidor (o caso do SQLite). Com Postgres e vários
# processos, trocar por lock no banco (SELECT ... FOR UPDATE) — ver README.
_trava_agenda = threading.Lock()


def _novo_codigo(db) -> str:
    while True:
        codigo = f"JR-{secrets.token_hex(3).upper()}"
        if not db.get(Agendamento, codigo):
            return codigo


# response_model_exclude_none: "canceladoPor" só aparece quando existe (igual ao tipo do front).
@rota.post(
    "",
    response_model=AgendamentoSaida,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
)
def criar(novo: NovoAgendamento, db: DB, usuario: UsuarioLogado, agora: Agora):
    servico = db.get(Servico, novo.servico_id)
    if not servico or not servico.ativo:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Este serviço não está mais disponível.")
    if novo.barbeiro_id != config.SEM_PREFERENCIA and not db.get(Barbeiro, novo.barbeiro_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Barbeiro não encontrado.")
    if not expediente_do_dia(db, novo.data):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A barbearia não abre neste dia.")
    if not data_no_periodo(novo.data, agora):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Data fora do período de agendamento.")

    horarios = dict(listar_horarios(db, novo.data, servico, novo.barbeiro_id, agora))
    if novo.hora not in horarios:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Horário inválido.")
    if inicio_agendamento(novo.data, novo.hora) < agora + timedelta(
        minutes=config.ANTECEDENCIA_AGENDAR_MIN
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Esse horário não está mais disponível. Escolha outro horário."
        )

    with _trava_agenda:
        barbeiro_id = primeiro_barbeiro_livre(
            db, novo.data, novo.hora, servico.duracao_min, novo.barbeiro_id
        )
        if not barbeiro_id:
            raise HTTPException(
                status.HTTP_409_CONFLICT, "Esse horário acabou de ser ocupado. Escolha outro horário."
            )

        agendamento = Agendamento(
            id=_novo_codigo(db),
            cliente_id=usuario.id,
            servico_id=servico.id,
            barbeiro_id=barbeiro_id,
            data=novo.data,
            hora=novo.hora,
            servico_nome=servico.nome,
            duracao_min=servico.duracao_min,
            preco_centavos=servico.preco_centavos,
            cliente_nome=novo.cliente.nome,
            cliente_telefone=novo.cliente.telefone,
            cliente_email=novo.cliente.email,
            cliente_observacao=novo.cliente.observacao,
            status="confirmado",
            criado_em=agora_utc(),
        )
        db.add(agendamento)

        # Contas do Google chegam sem telefone: guarda o informado (se ninguém mais usa).
        if not usuario.telefone_digitos:
            tel = digitos(novo.cliente.telefone)
            if not db.scalar(select(Usuario).where(Usuario.telefone_digitos == tel)):
                usuario.telefone = novo.cliente.telefone
                usuario.telefone_digitos = tel

        db.commit()
    return agendamento_saida(agendamento)


@rota.get("/meus", response_model=list[AgendamentoSaida], response_model_exclude_none=True)
def meus(db: DB, usuario: UsuarioLogado):
    # Sempre o usuário da sessão — nunca um id vindo do front.
    consulta = (
        select(Agendamento)
        .where(Agendamento.cliente_id == usuario.id)
        .order_by(Agendamento.data, Agendamento.hora)
    )
    return [agendamento_saida(a) for a in db.scalars(consulta)]


@rota.post("/{agendamento_id}/cancelar", status_code=status.HTTP_204_NO_CONTENT)
def cancelar(agendamento_id: str, db: DB, usuario: UsuarioLogado, agora: Agora):
    agendamento = db.get(Agendamento, agendamento_id)
    # Cliente não pode nem saber que o agendamento de outra pessoa existe.
    if not agendamento or (usuario.papel == "cliente" and agendamento.cliente_id != usuario.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamento não encontrado.")
    if agendamento.status != "confirmado":
        raise HTTPException(status.HTTP_409_CONFLICT, "Este agendamento já foi cancelado.")
    if usuario.papel == "cliente" and not cliente_pode_cancelar(agendamento, agora):
        horas = config.ANTECEDENCIA_CANCELAMENTO_MIN // 60
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"O cancelamento só pode ser feito até {horas} horas antes do horário.",
        )

    agendamento.status = "cancelado"
    agendamento.cancelado_por = usuario.papel
    db.commit()
