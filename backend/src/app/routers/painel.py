"""Painel do dono. Toda rota aqui exige papel "dono" (senão 403)."""
import threading
from collections import Counter
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select

from ..conversores import agendamento_saida, servico_saida
from .. import config
from ..dependencias import DB, Agora, apenas_dono
from ..models import Agendamento, Barbeiro, Servico
from ..schemas import (
    AgendamentoSaida,
    ClienteRelatorio,
    DadosServico,
    DiaRelatorio,
    HoraRelatorio,
    ItemRelatorio,
    RelatorioSaida,
    ServicoSaida,
)
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


# Um ano (com folga para ano bissexto): mais que isso pesa e quase nunca é o que se quer.
PERIODO_MAXIMO_DIAS = 366
QUANTOS_CLIENTES_FREQUENTES = 5


def _itens(quantidades: Counter, faturamento: Counter, nomes: dict[str, str]) -> list[ItemRelatorio]:
    itens = [
        ItemRelatorio(id=i, nome=nomes.get(i, i), quantidade=q, faturamento_centavos=faturamento[i])
        for i, q in quantidades.items()
    ]
    return sorted(itens, key=lambda x: (-x.quantidade, -x.faturamento_centavos, x.nome))


@rota.get("/relatorio", response_model=RelatorioSaida)
def relatorio(inicio: date, fim: date, db: DB, agora: Agora):
    """Resumo dos agendamentos com data entre `inicio` e `fim` (os dois inclusive)."""
    if fim < inicio:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "A data final precisa ser igual ou depois da inicial."
        )
    if (fim - inicio).days + 1 > PERIODO_MAXIMO_DIAS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Escolha um período de até 1 ano.")

    do_periodo = list(
        db.scalars(select(Agendamento).where(Agendamento.data.between(inicio, fim)))
    )
    confirmados = [a for a in do_periodo if a.status == "confirmado"]
    cancelados = [a for a in do_periodo if a.status == "cancelado"]

    # Nomes atuais (o serviço pode ter sido renomeado); se sumiu, usa o nome gravado.
    nomes_servicos = {a.servico_id: a.servico_nome for a in confirmados}
    nomes_servicos.update({s.id: s.nome for s in db.scalars(select(Servico))})
    nomes_barbeiros = {b.id: b.nome for b in db.scalars(select(Barbeiro))}

    agora_local = agora.astimezone(config.FUSO).replace(tzinfo=None)
    por_servico, fat_servico = Counter(), Counter()
    por_barbeiro, fat_barbeiro = Counter(), Counter()
    por_dia, fat_dia = Counter(), Counter()
    por_dia_semana = [0] * 7
    por_hora = Counter()
    por_cliente = Counter()
    ultimo_contato: dict[str, Agendamento] = {}
    realizado = 0

    for a in confirmados:
        preco = a.preco_centavos
        por_servico[a.servico_id] += 1
        fat_servico[a.servico_id] += preco
        por_barbeiro[a.barbeiro_id] += 1
        fat_barbeiro[a.barbeiro_id] += preco
        por_dia[a.data] += 1
        fat_dia[a.data] += preco
        por_dia_semana[(a.data.weekday() + 1) % 7] += 1  # weekday(): 0 = segunda
        por_hora[f"{a.hora[:2]}:00"] += 1
        por_cliente[a.cliente_id] += 1
        anterior = ultimo_contato.get(a.cliente_id)
        if not anterior or (a.data, a.hora) > (anterior.data, anterior.hora):
            ultimo_contato[a.cliente_id] = a
        h, m = map(int, a.hora.split(":"))
        if datetime(a.data.year, a.data.month, a.data.day, h, m) <= agora_local:
            realizado += preco

    # Novo = nenhum agendamento confirmado antes do início do período.
    clientes_antigos = set()
    if por_cliente:
        clientes_antigos = set(
            db.scalars(
                select(Agendamento.cliente_id)
                .where(
                    Agendamento.cliente_id.in_(por_cliente),
                    Agendamento.status == "confirmado",
                    Agendamento.data < inicio,
                )
                .distinct()
            )
        )

    faturamento = sum(a.preco_centavos for a in confirmados)
    frequentes = sorted(
        por_cliente.items(), key=lambda par: (-par[1], ultimo_contato[par[0]].cliente_nome)
    )[:QUANTOS_CLIENTES_FREQUENTES]

    return RelatorioSaida(
        inicio=inicio,
        fim=fim,
        agendamentos=len(confirmados),
        cancelados=len(cancelados),
        cancelados_pelo_cliente=sum(1 for a in cancelados if a.cancelado_por == "cliente"),
        faturamento_centavos=faturamento,
        faturamento_realizado_centavos=realizado,
        ticket_medio_centavos=round(faturamento / len(confirmados)) if confirmados else 0,
        clientes=len(por_cliente),
        clientes_novos=len(por_cliente.keys() - clientes_antigos),
        por_servico=_itens(por_servico, fat_servico, nomes_servicos),
        por_barbeiro=_itens(por_barbeiro, fat_barbeiro, nomes_barbeiros),
        por_dia_semana=por_dia_semana,
        por_hora=[HoraRelatorio(hora=h, quantidade=q) for h, q in sorted(por_hora.items())],
        por_dia=[
            DiaRelatorio(data=d, quantidade=por_dia[d], faturamento_centavos=fat_dia[d])
            for d in (inicio + timedelta(days=i) for i in range((fim - inicio).days + 1))
        ],
        clientes_frequentes=[
            ClienteRelatorio(
                nome=ultimo_contato[c].cliente_nome,
                telefone=ultimo_contato[c].cliente_telefone,
                quantidade=q,
            )
            for c, q in frequentes
        ],
    )
