from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from . import config


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


engine = criar_engine(config.DATABASE_URL)
SessaoLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def obter_db() -> Iterator[Session]:
    db = SessaoLocal()
    try:
        yield db
    finally:
        db.close()
