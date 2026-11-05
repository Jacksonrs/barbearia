from datetime import datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import config
from .database import obter_db
from .models import Usuario
from .seguranca import usuario_da_sessao

DB = Annotated[Session, Depends(obter_db)]
TokenSessao = Annotated[str | None, Cookie(alias=config.COOKIE_SESSAO)]


def obter_agora() -> datetime:
    """Hora atual no fuso da barbearia (substituída nos testes)."""
    return config.agora()


Agora = Annotated[datetime, Depends(obter_agora)]


def usuario_logado(db: DB, token: TokenSessao = None) -> Usuario:
    usuario = usuario_da_sessao(db, token)
    if not usuario:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Faça login para continuar.")
    return usuario


def apenas_dono(usuario: Annotated[Usuario, Depends(usuario_logado)]) -> Usuario:
    # Esconder a tela no front não basta: toda rota do painel passa por aqui.
    if usuario.papel != "dono":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Esta área é exclusiva da administração da barbearia."
        )
    return usuario


UsuarioLogado = Annotated[Usuario, Depends(usuario_logado)]
Dono = Annotated[Usuario, Depends(apenas_dono)]
