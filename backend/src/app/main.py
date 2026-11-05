"""Ponto de entrada da API.

Rodar (dentro de backend/):  .venv/bin/uvicorn app.main:app --reload --app-dir src
Documentação interativa:      http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from . import database, models  # noqa: F401  (registra as tabelas)
from .routers import agendamentos, auth, painel, publico
from .seed import popular


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    # Sem migrations por enquanto: cria as tabelas que faltam e insere os dados iniciais.
    database.Base.metadata.create_all(database.engine)
    with database.SessaoLocal() as db:
        popular(db)
    yield


app = FastAPI(title="Jr Barber API", version="0.1.0", lifespan=ciclo_de_vida)


@app.exception_handler(RequestValidationError)
async def erro_de_validacao(_: Request, exc: RequestValidationError):
    """O front exibe `detail` direto ao usuário: devolve uma frase, não a lista do Pydantic.

    `erros` traz a mensagem de cada campo, caso o front queira marcar o campo.
    """
    erros: dict[str, str] = {}
    for e in exc.errors():
        campo = ".".join(str(p) for p in e["loc"] if p not in ("body", "query", "path"))
        if e["type"] == "value_error":
            mensagem = str(e["ctx"]["error"])
        elif e["type"] == "missing":
            mensagem = "Campo obrigatório."
        else:
            mensagem = "Valor inválido."
        erros.setdefault(campo, mensagem)

    primeira = next(iter(erros.values()), "Dados inválidos.")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": primeira, "erros": erros},
    )


app.include_router(auth.rota)
app.include_router(publico.rota)
app.include_router(agendamentos.rota)
app.include_router(painel.rota)
