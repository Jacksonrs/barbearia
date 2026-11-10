"""Painel do dono. Toda rota aqui exige papel "dono" (senão 403)."""
import threading
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select

from ..conversores import agendamento_saida, servico_saida
from ..dependencias import DB, apenas_dono
from ..models import Agendamento, Servico
from ..schemas import AgendamentoSaida, DadosServico, ServicoSaida
from ..utils import slug

rota = APIRouter(prefix="/api/painel", tags=["painel"], dependencies=[Depends(apenas_dono)])

# O nome do serviço é único sem diferenciar maiúsculas, e o banco não garante isso
# sozinho: criar/editar um de cada vez evita dois "Corte" salvos ao mesmo tempo.
# Vale para UM processo do servidor (como a trava da agenda).
_trava_servicos = threading.Lock()


@rota.get("/agenda", response_model=list[AgendamentoSaida], response_model_exclude_none=True)
def agenda_do_dia(data: date, db: DB):
    """Todos os agendamentos do dia, inclusive cancelados, em ordem de horário."""
    consulta = select(Agendamento).where(Agendamento.data == data).order_by(Agendamento.hora)
    return [agendamento_saida(a) for a in db.scalars(consulta)]


@rota.get("/servicos", response_model=list[ServicoSaida])
def todos_servicos(db: DB):
    consulta = select(Servico).order_by(Servico.ordem)
    return [servico_saida(s) for s in db.scalars(consulta)]


def _nome_repetido(db, nome: str, ignorar_id: str | None = None) -> bool:
    consulta = select(Servico.id).where(func.lower(Servico.nome) == nome.lower())
    if ignorar_id:
        consulta = consulta.where(Servico.id != ignorar_id)
    return db.scalar(consulta) is not None


@rota.post("/servicos", response_model=ServicoSaida, status_code=status.HTTP_201_CREATED)
def criar_servico(dados: DadosServico, db: DB):
    with _trava_servicos:
        if _nome_repetido(db, dados.nome):
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe um serviço com esse nome.")

        base = slug(dados.nome)
        novo_id, n = base, 2
        while db.get(Servico, novo_id):
            novo_id, n = f"{base}-{n}", n + 1

        servico = Servico(
            id=novo_id,
            nome=dados.nome,
            descricao=dados.descricao,
            duracao_min=dados.duracao_min,
            preco_centavos=dados.preco_centavos,
            ativo=dados.ativo,
            ordem=(db.scalar(select(func.max(Servico.ordem))) or 0) + 1,
        )
        db.add(servico)
        db.commit()
    return servico_saida(servico)


@rota.put("/servicos/{servico_id}", response_model=ServicoSaida)
def atualizar_servico(servico_id: str, dados: DadosServico, db: DB):
    with _trava_servicos:
        servico = db.get(Servico, servico_id)
        if not servico:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Serviço não encontrado.")
        if _nome_repetido(db, dados.nome, ignorar_id=servico_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe um serviço com esse nome.")

        # O id não muda ao renomear: agendamentos antigos continuam apontando para ele.
        servico.nome = dados.nome
        servico.descricao = dados.descricao
        servico.duracao_min = dados.duracao_min
        servico.preco_centavos = dados.preco_centavos
        servico.ativo = dados.ativo
        db.commit()
    return servico_saida(servico)
