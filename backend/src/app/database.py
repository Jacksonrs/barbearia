from collections.abc import Iterator

from sqlalchemy import Engine, create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from . import config

# Colunas criadas depois que o banco já existia. O create_all só cria tabelas que
# faltam, não altera as que já existem; então elas são adicionadas no start.
# (tabela, coluna, tipo) — o tipo precisa de DEFAULT para preencher as linhas antigas.
COLUNAS_NOVAS = [
    ("servicos", "preco_centavos", "INTEGER NOT NULL DEFAULT 0"),
    ("agendamentos", "preco_centavos", "INTEGER NOT NULL DEFAULT 0"),
]


class Base(DeclarativeBase):
    pass


def criar_engine(url: str, **kwargs):
    if url.startswith("sqlite"):
        kwargs.setdefault("connect_args", {"check_same_thread": False})
    engine = create_engine(url, **kwargs)
    if url.startswith("sqlite"):
        # SQLite só respeita chaves estrangeiras com este PRAGMA.
        @event.listens_for(engine, "connect")
        def _fk(conexao, _):
            conexao.execute("PRAGMA foreign_keys=ON")

    return engine


def adicionar_colunas_novas(engine: Engine) -> None:
    with engine.begin() as conexao:
        inspetor = inspect(conexao)
        tabelas = set(inspetor.get_table_names())
        for tabela, coluna, tipo in COLUNAS_NOVAS:
            if tabela not in tabelas:
                continue  # o create_all cria a tabela já com a coluna
            if coluna not in {c["name"] for c in inspetor.get_columns(tabela)}:
                conexao.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {tipo}"))


engine =criar_engine(config.DATABASE_URL)
SessaoLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def obter_db() -> Iterator[Session]:
    db = SessaoLocal()
    try:
        yield db
    finally:
        db.close()
