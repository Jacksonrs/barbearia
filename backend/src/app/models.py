"""Tabelas do banco."""
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    # Telefone como o cliente digitou, ex.: "(11) 98765-4321" (para exibir).
    telefone: Mapped[str | None] = mapped_column(String(20))
    # Só dígitos, para comparar e garantir que não há duas contas com o mesmo número.
    telefone_digitos: Mapped[str | None] = mapped_column(String(11), unique=True)
    # Sempre em minúsculas. NULL quando não informado (conta só com telefone).
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    papel: Mapped[str] = mapped_column(String(10), default="cliente")  # cliente | dono
    provedor: Mapped[str] = mapped_column(String(10), default="senha")  # senha | google
    senha_hash: Mapped[str | None] = mapped_column(String(255))
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime)


class Sessao(Base):
    __tablename__ = "sessoes"

    # Guarda só o hash do token; o token em si fica apenas no cookie do navegador.
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    usuario_id: Mapped[str] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    expira_em: Mapped[datetime] = mapped_column(DateTime)

    usuario: Mapped[Usuario] = relationship()


class Servico(Base):
    __tablename__ = "servicos"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    nome: Mapped[str] = mapped_column(String(40))
    descricao: Mapped[str] = mapped_column(String(120))
    duracao_min: Mapped[int] = mapped_column(Integer)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    # Ordem de exibição (novos serviços entram no fim).
    ordem: Mapped[int] = mapped_column(Integer, default=0)


class Barbeiro(Base):
    __tablename__ = "barbeiros"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)
    nome: Mapped[str] = mapped_column(String(80))
    especialidade: Mapped[str] = mapped_column(String(120))
    # Ordem de escolha quando o cliente não tem preferência.
    ordem: Mapped[int] = mapped_column(Integer, default=0)


class Expediente(Base):
    """Horário de funcionamento por dia da semana (0 = domingo ... 6 = sábado)."""

    __tablename__ = "expediente"

    dia_semana: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Minutos desde 00:00; NULL = fechado.
    abre_min: Mapped[int | None] = mapped_column(Integer)
    fecha_min: Mapped[int | None] = mapped_column(Integer)


class Agendamento(Base):
    __tablename__ = "agendamentos"
    __table_args__ = (Index("ix_agendamentos_data_barbeiro", "data", "barbeiro_id"),)

    id: Mapped[str] = mapped_column(String(12), primary_key=True)  # ex.: JR-A1B2C3
    cliente_id: Mapped[str] = mapped_column(ForeignKey("usuarios.id"), index=True)
    servico_id: Mapped[str] = mapped_column(ForeignKey("servicos.id"))
    barbeiro_id: Mapped[str] = mapped_column(ForeignKey("barbeiros.id"))
    data: Mapped[date] = mapped_column(Date)
    hora: Mapped[str] = mapped_column(String(5))  # HH:MM

    # Cópias do momento do agendamento (o serviço pode mudar depois).
    servico_nome: Mapped[str] = mapped_column(String(40))
    duracao_min: Mapped[int] = mapped_column(Integer)

    # Dados de contato informados neste agendamento (podem diferir da conta).
    cliente_nome: Mapped[str] = mapped_column(String(120))
    cliente_telefone: Mapped[str] = mapped_column(String(20))
    cliente_email: Mapped[str] = mapped_column(String(254), default="")
    cliente_observacao: Mapped[str] = mapped_column(String(200), default="")

    status: Mapped[str] = mapped_column(String(12), default="confirmado")  # confirmado | cancelado
    cancelado_por: Mapped[str | None] = mapped_column(String(10))  # cliente | dono
    criado_em: Mapped[datetime] = mapped_column(DateTime)
