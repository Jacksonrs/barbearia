"""Base dos testes: cada teste roda com um banco SQLite novo (arquivo temporário),
os dados iniciais do seed e um relógio fixo que o próprio teste pode adiantar.

Rodar (dentro de backend/):  .venv/bin/pytest
"""
import os
from datetime import date, datetime

# Antes de importar o app: os testes NUNCA usam o banco do .env.local (Neon de produção).
# O config.py não sobrescreve variáveis já definidas.
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker

from app import config, limite_login, seguranca
from app.database import Base, criar_engine, obter_db
from app.dependencias import obter_agora
from app.main import app
from app.seed import popular

# O argon2 é lento de propósito (contra força bruta). Nos testes isso só atrasa:
# usa o custo mínimo. O comportamento (hash, conferência) é o mesmo.
seguranca._hasher = PasswordHasher(time_cost=1, memory_cost=8, parallelism=1)
seguranca._HASH_FALSO = seguranca._hasher.hash("senha-que-nao-existe")

# Terça-feira (barbearia abre das 09:00 às 19:00).
TERCA = date(2026, 11, 10)
QUARTA = date(2026, 11, 11)
DOMINGO = date(2026, 11, 15)
SEGUNDA = date(2026, 11, 16)


def em(data: date, hora: str) -> datetime:
    h, m = map(int, hora.split(":"))
    return datetime(data.year, data.month, data.day, h, m, tzinfo=config.FUSO)


class Relogio:
    def __init__(self):
        self.agora = em(TERCA, "08:00")

    def ir_para(self, data: date, hora: str):
        self.agora = em(data, hora)


@pytest.fixture
def relogio():
    return Relogio()


@pytest.fixture
def fabrica_db(tmp_path):
    engine = criar_engine(f"sqlite:///{tmp_path / 'teste.db'}")

    # Banco descartável: não precisa esperar o disco gravar (deixa os testes bem mais rápidos).
    @event.listens_for(engine, "connect")
    def _sem_fsync(conexao, _):
        conexao.execute("PRAGMA synchronous=OFF")
        conexao.execute("PRAGMA journal_mode=MEMORY")

    Base.metadata.create_all(engine)
    fabrica = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with fabrica() as db:
        popular(db)
    yield fabrica
    engine.dispose()


@pytest.fixture
def db(fabrica_db):
    with fabrica_db() as sessao:
        yield sessao


@pytest.fixture(autouse=True)
def _app(fabrica_db, relogio):
    def obter_db_teste():
        with fabrica_db() as sessao:
            yield sessao

    app.dependency_overrides[obter_db] = obter_db_teste
    app.dependency_overrides[obter_agora] = lambda: relogio.agora
    limite_login.zerar()
    yield
    app.dependency_overrides.clear()
    limite_login.zerar()


def novo_cliente() -> TestClient:
    # Sem "with": não roda o startup da aplicação (que usaria o banco de verdade).
    return TestClient(app)


@pytest.fixture
def anonimo():
    return novo_cliente()


def cadastrar(c: TestClient, telefone="(11) 98765-4321", email="", nome="Cliente Teste", senha="segredo1"):
    r = c.post("/api/auth/cadastro", json={"nome": nome, "telefone": telefone, "email": email, "senha": senha})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def cliente():
    c = novo_cliente()
    c.usuario = cadastrar(c)
    return c


@pytest.fixture
def outro_cliente():
    c = novo_cliente()
    c.usuario = cadastrar(c, telefone="(21) 91111-2222", nome="Outra Pessoa")
    return c


@pytest.fixture
def dono():
    c = novo_cliente()
    r = c.post(
        "/api/auth/entrar",
        json={"tipo": "email", "identificador": config.DONO_EMAIL, "senha": config.DONO_SENHA},
    )
    assert r.status_code == 200, r.text
    return c


def agendar(c: TestClient, hora="10:00", data=TERCA, servico="corte", barbeiro="junior", **cliente):
    dados_cliente = {"nome": "Cliente Teste", "telefone": "(11) 98765-4321", "email": "", "observacao": ""}
    dados_cliente.update(cliente)
    return c.post(
        "/api/agendamentos",
        json={
            "servicoId": servico,
            "barbeiroId": barbeiro,
            "data": data.isoformat(),
            "hora": hora,
            "cliente": dados_cliente,
        },
    )
