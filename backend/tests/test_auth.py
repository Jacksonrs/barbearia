"""Cadastro, login (senha e Google), limite de tentativas e sessão."""
from datetime import timedelta

import pytest
from sqlalchemy import select

from app import config
from app.models import Sessao, Usuario
from conftest import cadastrar, novo_cliente


def entrar(c, identificador, senha="segredo1", tipo="telefone"):
    return c.post("/api/auth/entrar", json={"tipo": tipo, "identificador": identificador, "senha": senha})


# ---------- cadastro ----------


def test_cadastro_abre_sessao(anonimo):
    usuario = cadastrar(anonimo, email="  Fulano@Exemplo.com ")
    assert usuario["papel"] == "cliente"
    assert usuario["provedor"] == "senha"
    assert usuario["email"] == "fulano@exemplo.com"
    assert usuario["telefone"] == "(11) 98765-4321"
    assert "senha" not in usuario and "senhaHash" not in usuario

    cookie = anonimo.cookies.get(config.COOKIE_SESSAO)
    assert cookie
    assert anonimo.get("/api/auth/eu").json() == usuario


def test_cookie_httponly_e_lax(anonimo):
    r = anonimo.post(
        "/api/auth/cadastro",
        json={"nome": "Cliente", "telefone": "11987654321", "email": "", "senha": "segredo1"},
    )
    cabecalho = r.headers["set-cookie"].lower()
    assert "httponly" in cabecalho and "samesite=lax" in cabecalho and "path=/" in cabecalho


def test_token_guardado_so_como_hash(anonimo, db):
    cadastrar(anonimo)
    token = anonimo.cookies.get(config.COOKIE_SESSAO)
    hashes = list(db.scalars(select(Sessao.token_hash)))
    assert len(hashes) == 1 and hashes[0] != token


def test_cadastro_sem_email_fica_null(anonimo, db):
    cadastrar(anonimo)
    cadastrar(novo_cliente(), telefone="(21) 99999-0000")  # dois sem e-mail não conflitam
    assert all(u.email is None for u in db.scalars(select(Usuario).where(Usuario.papel == "cliente")))


def test_telefone_repetido_em_outro_formato(anonimo):
    cadastrar(anonimo)
    r = novo_cliente().post(
        "/api/auth/cadastro",
        json={"nome": "Outra", "telefone": "11 98765 4321", "email": "", "senha": "segredo1"},
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "Já existe uma conta com este telefone. Tente entrar."


def test_email_repetido_sem_diferenciar_maiusculas(anonimo):
    cadastrar(anonimo, email="a@b.com")
    r = novo_cliente().post(
        "/api/auth/cadastro",
        json={"nome": "Outra", "telefone": "21999990000", "email": "A@B.COM", "senha": "segredo1"},
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "Já existe uma conta com este e-mail. Tente entrar."


@pytest.mark.parametrize(
    ("campo", "valor", "mensagem"),
    [
        ("nome", "  ab ", "Informe seu nome."),
        ("telefone", "", "Informe seu telefone."),
        ("telefone", "98765-4321", "Telefone incompleto. Inclua o DDD."),
        ("telefone", "119876543210", "Telefone inválido."),
        ("telefone", "(11) 98765-4321" + " " * 10 + "-", "Telefone inválido."),
        ("email", "sem-arroba", "E-mail inválido."),
        ("senha", "12345", "A senha precisa ter pelo menos 6 caracteres."),
        ("senha", "x" * 129, "Senha muito longa."),
    ],
)
def test_validacoes_do_cadastro(anonimo, campo, valor, mensagem):
    dados = {"nome": "Cliente", "telefone": "11987654321", "email": "", "senha": "segredo1", campo: valor}
    r = anonimo.post("/api/auth/cadastro", json=dados)
    assert r.status_code == 422
    assert r.json() == {"detail": mensagem, "erros": {campo: mensagem}}


def test_campo_faltando(anonimo):
    r = anonimo.post("/api/auth/cadastro", json={"nome": "Cliente", "telefone": "11987654321"})
    assert r.status_code == 422
    assert r.json()["erros"] == {"senha": "Campo obrigatório."}


def test_json_quebrado_nao_vira_500(anonimo):
    r = anonimo.post("/api/auth/cadastro", content="{", headers={"Content-Type": "application/json"})
    assert r.status_code == 422
    assert isinstance(r.json()["detail"], str)


# ---------- login ----------


def test_entrar_por_telefone_e_email(anonimo):
    cadastrar(anonimo, email="cli@exemplo.com")
    anonimo.post("/api/auth/sair")

    r = entrar(novo_cliente(), "11987654321")
    assert r.status_code == 200 and r.json()["nome"] == "Cliente Teste"

    c = novo_cliente()
    r = entrar(c, " CLI@exemplo.com", tipo="email")
    assert r.status_code == 200
    assert c.get("/api/auth/eu").status_code == 200


def test_dono_entra(dono):
    eu = dono.get("/api/auth/eu").json()
    assert eu["papel"] == "dono" and eu["email"] == config.DONO_EMAIL and eu["telefone"] == ""


def test_mesma_mensagem_para_senha_errada_e_conta_inexistente(cliente):
    errada = entrar(novo_cliente(), "11987654321", senha="errada")
    inexistente = entrar(novo_cliente(), "11900000000")
    assert errada.status_code == inexistente.status_code == 401
    assert errada.json()["detail"] == inexistente.json()["detail"] == "Telefone ou senha incorretos."
    r = entrar(novo_cliente(), "ninguem@x.com", tipo="email")
    assert r.json()["detail"] == "E-mail ou senha incorretos."


def test_tipo_de_login_invalido(anonimo):
    r = anonimo.post("/api/auth/entrar", json={"tipo": "cpf", "identificador": "1", "senha": "x"})
    assert r.status_code == 422


def test_limite_de_tentativas(cliente):
    c = novo_cliente()
    for _ in range(5):
        assert entrar(c, "11987654321", senha="errada").status_code == 401
    r = entrar(c, "(11) 98765-4321")  # senha certa, mas bloqueado (mesma conta, outro formato)
    assert r.status_code == 429
    assert r.json()["detail"] == "Muitas tentativas de login. Tente novamente em 15 min."
    # Outra conta não é afetada.
    assert entrar(c, config.DONO_EMAIL, senha=config.DONO_SENHA, tipo="email").status_code == 200


def test_login_certo_zera_as_falhas(cliente):
    c = novo_cliente()
    for _ in range(4):
        entrar(c, "11987654321", senha="errada")
    assert entrar(c, "11987654321").status_code == 200
    for _ in range(4):
        assert entrar(c, "11987654321", senha="errada").status_code == 401
    assert entrar(c, "11987654321").status_code == 200


def test_bloqueio_expira(cliente, monkeypatch):
    from app import limite_login

    instante = [1000.0]
    monkeypatch.setattr(limite_login.time, "monotonic", lambda: instante[0])
    c = novo_cliente()
    for _ in range(5):
        entrar(c, "11987654321", senha="errada")
    assert entrar(c, "11987654321").status_code == 429
    instante[0] += 14 * 60
    assert "1 min" in entrar(c, "11987654321").json()["detail"]
    instante[0] += 60
    assert entrar(c, "11987654321").status_code == 200


# ---------- sessão ----------


def test_sem_sessao(anonimo):
    r = anonimo.get("/api/auth/eu")
    assert r.status_code == 401 and r.json()["detail"] == "Faça login para continuar."
    anonimo.cookies.set(config.COOKIE_SESSAO, "token-inventado")
    assert anonimo.get("/api/auth/eu").status_code == 401


def test_sair_encerra_a_sessao_no_servidor(cliente, db):
    token = cliente.cookies.get(config.COOKIE_SESSAO)
    assert cliente.post("/api/auth/sair").status_code == 204
    assert cliente.get("/api/auth/eu").status_code == 401
    assert db.scalar(select(Sessao)) is None

    # O token antigo não volta a valer mesmo se alguém o guardou.
    c = novo_cliente()
    c.cookies.set(config.COOKIE_SESSAO, token)
    assert c.get("/api/auth/eu").status_code == 401


def test_sair_sem_sessao(anonimo):
    assert anonimo.post("/api/auth/sair").status_code == 204


def test_sessao_vencida(cliente, db):
    sessao = db.scalar(select(Sessao))
    sessao.expira_em -= timedelta(days=config.SESSAO_DIAS + 1)
    db.commit()
    assert cliente.get("/api/auth/eu").status_code == 401


# ---------- Google ----------


def test_google_sem_configuracao(anonimo):
    r = anonimo.post("/api/auth/google", json={"credencial": "x"})
    assert r.status_code == 501
    assert r.json()["detail"] == "Login com Google ainda não configurado."


@pytest.fixture
def google(monkeypatch):
    """Simula o Google: o "token" é a chave de um dicionário com os dados da conta."""
    from google.oauth2 import id_token

    contas: dict[str, dict] = {}

    def verificar(token, _requisicao, client_id):
        assert client_id == "id-de-teste"
        if token not in contas:
            raise ValueError("token inválido")
        return contas[token]

    monkeypatch.setattr(config, "GOOGLE_CLIENT_ID", "id-de-teste")
    monkeypatch.setattr(id_token, "verify_oauth2_token", verificar)
    return contas


def test_google_cria_conta_e_entra_de_novo(anonimo, google):
    google["tk"] = {"sub": "g1", "email": "Ana@Gmail.com", "email_verified": True, "name": "Ana"}
    r = anonimo.post("/api/auth/google", json={"credencial": "tk"})
    assert r.status_code == 200
    usuario = r.json()
    assert usuario["provedor"] == "google" and usuario["email"] == "ana@gmail.com"
    assert usuario["telefone"] == ""

    r = novo_cliente().post("/api/auth/google", json={"credencial": "tk"})
    assert r.json()["id"] == usuario["id"]


def test_google_token_invalido(anonimo, google):
    r = anonimo.post("/api/auth/google", json={"credencial": "falso"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Não foi possível entrar com o Google."


def test_google_nao_vincula_conta_com_senha(anonimo, google):
    cadastrar(anonimo, email="ana@gmail.com")
    google["tk"] = {"sub": "g1", "email": "ana@gmail.com", "email_verified": True}
    r = novo_cliente().post("/api/auth/google", json={"credencial": "tk"})
    assert r.status_code == 409


def test_google_com_email_nao_verificado_nao_ocupa_o_email(anonimo, google):
    google["tk"] = {"sub": "g1", "email": "alguem@empresa.com", "email_verified": False, "name": "X" * 300}
    r = anonimo.post("/api/auth/google", json={"credencial": "tk"})
    assert r.status_code == 200
    assert r.json()["email"] == "" and len(r.json()["nome"]) == 120
    # O dono verdadeiro do e-mail ainda consegue se cadastrar.
    cadastrar(novo_cliente(), email="alguem@empresa.com")


def test_conta_google_nao_entra_por_senha(anonimo, google):
    google["tk"] = {"sub": "g1", "email": "ana@gmail.com", "email_verified": True}
    anonimo.post("/api/auth/google", json={"credencial": "tk"})
    assert entrar(novo_cliente(), "ana@gmail.com", senha="qualquer", tipo="email").status_code == 401


# ---------- dispositivo confiável ----------


def test_bloqueio_feito_por_outra_pessoa_nao_tranca_quem_ja_entrou(cliente):
    dono_da_conta = novo_cliente()
    assert entrar(dono_da_conta, "11987654321").status_code == 200
    assert dono_da_conta.cookies.get(config.COOKIE_DISPOSITIVO)

    atacante = novo_cliente()
    for _ in range(5):
        entrar(atacante, "11987654321", senha="errada")
    assert entrar(atacante, "11987654321").status_code == 429
    # O navegador onde a conta já entrou continua entrando.
    assert entrar(dono_da_conta, "11987654321").status_code == 200


def test_dispositivo_confiavel_tambem_tem_limite(cliente):
    c = novo_cliente()
    entrar(c, "11987654321")
    for _ in range(5):
        assert entrar(c, "11987654321", senha="errada").status_code == 401
    assert entrar(c, "11987654321").status_code == 429
    # As falhas desse navegador não bloqueiam os outros.
    assert entrar(novo_cliente(), "11987654321").status_code == 200


def test_cookie_de_dispositivo_vale_so_para_a_propria_conta(cliente, outro_cliente):
    c = novo_cliente()
    entrar(c, "11987654321")  # confiável para a conta do `cliente`
    for _ in range(5):
        entrar(novo_cliente(), "21911112222", senha="errada")
    assert entrar(c, "21911112222").status_code == 429


def test_cookie_de_dispositivo_falsificado(cliente):
    for _ in range(5):
        entrar(novo_cliente(), "11987654321", senha="errada")
    c = novo_cliente()
    c.cookies.set(config.COOKIE_DISPOSITIVO, "inventado.abc123", path="/api/auth")
    assert entrar(c, "11987654321").status_code == 429


def test_cookie_de_dispositivo_httponly_e_restrito_ao_login(cliente):
    r = entrar(novo_cliente(), "11987654321")
    cookies = [v.lower() for k, v in r.headers.multi_items() if k == "set-cookie"]
    dispositivo = next(v for v in cookies if v.startswith(config.COOKIE_DISPOSITIVO))
    assert "httponly" in dispositivo and "path=/api/auth" in dispositivo


def test_contas_sem_falhas_recentes_saem_da_memoria(monkeypatch):
    from app import limite_login

    instante = [1000.0]
    monkeypatch.setattr(limite_login.time, "monotonic", lambda: instante[0])
    for i in range(100):
        limite_login.registrar_falha(f"email:{i}@x.com")
    assert len(limite_login._falhas) == 100
    instante[0] += limite_login.JANELA_SEG
    limite_login.registrar_falha("email:novo@x.com")
    assert list(limite_login._falhas) == ["email:novo@x.com"]


# ---------- senha padrão do dono ----------


def _senha_do_dono_confere(db, senha):
    from app.seguranca import conferir_senha

    dono = db.scalar(select(Usuario).where(Usuario.papel == "dono"))
    db.refresh(dono)
    return conferir_senha(dono.senha_hash, senha)


def test_dono_com_senha_padrao_em_producao_nao_sobe(db, monkeypatch):
    from app.seed import popular

    monkeypatch.setattr(config, "COOKIE_SEGURO", True)
    with pytest.raises(RuntimeError, match="DONO_SENHA"):
        popular(db)


def test_dono_senha_definida_troca_a_padrao(db, monkeypatch):
    from app.seed import popular

    monkeypatch.setattr(config, "COOKIE_SEGURO", True)
    monkeypatch.setattr(config, "DONO_SENHA", "Senha-Forte-123")
    popular(db)
    assert _senha_do_dono_confere(db, "Senha-Forte-123")
    assert not _senha_do_dono_confere(db, config.DONO_SENHA_PADRAO)
    popular(db)  # próximo start: nada a fazer
    assert _senha_do_dono_confere(db, "Senha-Forte-123")


def test_dono_que_ja_trocou_a_senha_nao_e_mexido(db, monkeypatch):
    from app.seed import popular
    from app.seguranca import gerar_hash_senha

    dono = db.scalar(select(Usuario).where(Usuario.papel == "dono"))
    dono.senha_hash = gerar_hash_senha("Trocada-Pelo-Dono")
    db.commit()
    monkeypatch.setattr(config, "COOKIE_SEGURO", True)
    monkeypatch.setattr(config, "DONO_SENHA", "Outra-Do-Ambiente")
    popular(db)
    assert _senha_do_dono_confere(db, "Trocada-Pelo-Dono")


def test_banco_novo_em_producao_com_senha_padrao_nao_sobe(tmp_path, monkeypatch):
    """No primeiro start o dono acabou de ser criado: a conferência também precisa vê-lo."""
    from sqlalchemy.orm import sessionmaker

    from app.database import Base, criar_engine
    from app.seed import popular

    engine = criar_engine(f"sqlite:///{tmp_path / 'novo.db'}")
    Base.metadata.create_all(engine)
    monkeypatch.setattr(config, "COOKIE_SEGURO", True)
    with sessionmaker(bind=engine, autoflush=False)() as db, pytest.raises(RuntimeError):
        popular(db)
    engine.dispose()
