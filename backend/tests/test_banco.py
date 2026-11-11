"""Banco criado por uma versão antiga do backend continua funcionando."""
from sqlalchemy import inspect, text

from app.database import adicionar_colunas_novas, criar_engine


def test_adiciona_preco_em_banco_antigo(tmp_path):
    engine = criar_engine(f"sqlite:///{tmp_path / 'antigo.db'}")
    with engine.begin() as con:
        # Tabela como era antes do preço.
        con.execute(text(
            "CREATE TABLE servicos (id VARCHAR(60) PRIMARY KEY, nome VARCHAR(40) NOT NULL,"
            " descricao VARCHAR(120) NOT NULL, duracao_min INTEGER NOT NULL,"
            " ativo BOOLEAN NOT NULL, ordem INTEGER NOT NULL)"
        ))
        con.execute(text("INSERT INTO servicos VALUES ('corte', 'Corte', 'Desc', 30, 1, 0)"))

    adicionar_colunas_novas(engine)
    adicionar_colunas_novas(engine)  # rodar de novo (cada start) não dá erro

    assert "preco_centavos" in {c["name"] for c in inspect(engine).get_columns("servicos")}
    with engine.connect() as con:
        assert con.execute(text("SELECT preco_centavos FROM servicos")).scalar() == 0


def test_banco_sem_tabelas_nao_da_erro(tmp_path):
    adicionar_colunas_novas(criar_engine(f"sqlite:///{tmp_path / 'novo.db'}"))
