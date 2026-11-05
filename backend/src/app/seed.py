"""Dados iniciais, inseridos só quando a tabela correspondente está vazia.

Iguais a frontend/src/services/dadosExemplo.ts. Troque pelos dados reais da Jr Barber.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .models import Barbeiro, Expediente, Servico, Usuario
from .seguranca import gerar_hash_senha
from .utils import agora_utc, normalizar_email

SERVICOS = [
    ("corte", "Corte", "Na tesoura ou na máquina, com acabamento na navalha.", 30),
    ("barba", "Barba", "Toalha quente, navalha e hidratação.", 30),
    ("corte-barba", "Corte + Barba", "O serviço completo em um único horário.", 60),
]

BARBEIROS = [
    ("junior", "Junior", "Cortes clássicos e degradê"),
    ("rafael", "Rafael", "Barba e navalha"),
    ("lucas", "Lucas", "Cortes modernos"),
]

# Índice 0 = domingo. (abre, fecha) em minutos desde 00:00; None = fechado.
EXPEDIENTE = [
    None,  # domingo
    None,  # segunda
    (9 * 60, 19 * 60),
    (9 * 60, 19 * 60),
    (9 * 60, 19 * 60),
    (9 * 60, 19 * 60),
    (8 * 60, 16 * 60),  # sábado
]


def _vazia(db: Session, modelo) -> bool:
    return db.scalar(select(modelo).limit(1)) is None


def popular(db: Session) -> None:
    if _vazia(db, Servico):
        db.add_all(
            Servico(id=i, nome=n, descricao=d, duracao_min=m, ativo=True, ordem=k)
            for k, (i, n, d, m) in enumerate(SERVICOS)
        )
    if _vazia(db, Barbeiro):
        db.add_all(
            Barbeiro(id=i, nome=n, especialidade=e, ordem=k)
            for k, (i, n, e) in enumerate(BARBEIROS)
        )
    if _vazia(db, Expediente):
        db.add_all(
            Expediente(dia_semana=d, abre_min=h[0] if h else None, fecha_min=h[1] if h else None)
            for d, h in enumerate(EXPEDIENTE)
        )
    if db.scalar(select(Usuario).where(Usuario.papel == "dono")) is None:
        db.add(
            Usuario(
                id=str(uuid.uuid4()),
                nome="Administrador",
                email=normalizar_email(config.DONO_EMAIL),
                papel="dono",
                provedor="senha",
                senha_hash=gerar_hash_senha(config.DONO_SENHA),
                criado_em=agora_utc(),
            )
        )
    db.commit()
