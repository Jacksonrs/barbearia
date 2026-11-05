"""Senhas (argon2) e sessões (token aleatório guardado em cookie httpOnly)."""
import hashlib
import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from . import config
from .models import Sessao, Usuario
from .utils import agora_utc

_hasher = PasswordHasher()
# Hash usado quando o usuário não existe, para o tempo de resposta não revelar isso.
_HASH_FALSO = _hasher.hash("senha-que-nao-existe")


def gerar_hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def conferir_senha(senha_hash: str | None, senha: str) -> bool:
    try:
        return _hasher.verify(senha_hash or _HASH_FALSO, senha) and senha_hash is not None
    except (VerificationError, InvalidHashError):
        # Hash corrompido no banco conta como senha errada (e não como erro 500).
        return False


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def abrir_sessao(db: Session, usuario: Usuario, resposta: Response) -> None:
    token = secrets.token_urlsafe(32)
    db.add(
        Sessao(
            token_hash=_hash_token(token),
            usuario_id=usuario.id,
            expira_em=agora_utc() + timedelta(days=config.SESSAO_DIAS),
        )
    )
    # Aproveita para limpar sessões vencidas.
    db.execute(delete(Sessao).where(Sessao.expira_em < agora_utc()))
    db.commit()
    resposta.set_cookie(
        config.COOKIE_SESSAO,
        token,
        max_age=config.SESSAO_DIAS * 24 * 3600,
        httponly=True,
        secure=config.COOKIE_SEGURO,
        samesite="lax",
        path="/",
    )


def usuario_da_sessao(db: Session, token: str | None) -> Usuario | None:
    if not token:
        return None
    sessao = db.get(Sessao, _hash_token(token))
    if not sessao or sessao.expira_em < agora_utc():
        return None
    return sessao.usuario


def encerrar_sessao(db: Session, token: str | None, resposta: Response) -> None:
    if token:
        db.execute(delete(Sessao).where(Sessao.token_hash == _hash_token(token)))
        db.commit()
    resposta.delete_cookie(config.COOKIE_SESSAO, path="/")
