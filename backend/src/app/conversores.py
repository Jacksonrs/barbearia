"""Converte linhas do banco para os formatos de saída da API."""
from datetime import UTC

from .models import Agendamento, Servico, Usuario
from .schemas import AgendamentoSaida, ClienteSaida, ServicoSaida, UsuarioSaida


def usuario_saida(u: Usuario) -> UsuarioSaida:
    return UsuarioSaida(
        id=u.id,
        nome=u.nome,
        telefone=u.telefone or "",
        email=u.email or "",
        papel=u.papel,
        provedor=u.provedor,
    )


def servico_saida(s: Servico) -> ServicoSaida:
    return ServicoSaida(
        id=s.id,
        nome=s.nome,
        descricao=s.descricao,
        duracao_min=s.duracao_min,
        preco_centavos=s.preco_centavos,
        ativo=s.ativo,
    )


def agendamento_saida(a: Agendamento) -> AgendamentoSaida:
    return AgendamentoSaida(
        id=a.id,
        cliente_id=a.cliente_id,
        servico_id=a.servico_id,
        servico_nome=a.servico_nome,
        barbeiro_id=a.barbeiro_id,
        data=a.data,
        hora=a.hora,
        duracao_min=a.duracao_min,
        cliente=ClienteSaida(
            nome=a.cliente_nome,
            telefone=a.cliente_telefone,
            email=a.cliente_email,
            observacao=a.cliente_observacao,
        ),
        status=a.status,
        criado_em=a.criado_em.replace(tzinfo=UTC),
        cancelado_por=a.cancelado_por,
    )
