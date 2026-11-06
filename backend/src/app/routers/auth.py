import uuid
from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .. import config, limite_login
from ..conversores import usuario_saida
from ..dependencias import DB, TokenSessao, UsuarioLogado
from ..models import Usuario
from ..schemas import Credenciais, DadosCadastro, LoginGoogle, UsuarioSaida
from ..seguranca import abrir_sessao, conferir_senha, encerrar_sessao, gerar_hash_senha
from ..utils import agora_utc, digitos, normalizar_email

rota = APIRouter(prefix="/api/auth", tags=["contas"])


@rota.post("/cadastro", response_model=UsuarioSaida, status_code=status.HTTP_201_CREATED)
def cadastrar(dados: DadosCadastro, db: DB, resposta: Response):
    telefone_digitos = digitos(dados.telefone)
    email = normalizar_email(dados.email) or None

    def conferir_duplicado():
        if db.scalar(select(Usuario).where(Usuario.telefone_digitos == telefone_digitos)):
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este telefone. Tente entrar.")
        if email and db.scalar(select(Usuario).where(Usuario.email == email)):
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este e-mail. Tente entrar.")

    conferir_duplicado()
    usuario = Usuario(
        id=str(uuid.uuid4()),
        nome=dados.nome,
        telefone=dados.telefone,
        telefone_digitos=telefone_digitos,
        email=email,
        papel="cliente",
        provedor="senha",
        senha_hash=gerar_hash_senha(dados.senha),
        criado_em=agora_utc(),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        # Outro cadastro com o mesmo telefone/e-mail terminou entre a conferência e o commit.
        db.rollback()
        conferir_duplicado()
        raise
    abrir_sessao(db, usuario, resposta)
    return usuario_saida(usuario)


CookieDispositivo = Annotated[str | None, Cookie(alias=config.COOKIE_DISPOSITIVO)]


@rota.post("/entrar", response_model=UsuarioSaida)
def entrar(
    credenciais: Credenciais, db: DB, resposta: Response, dispositivo: CookieDispositivo = None
):
    if credenciais.tipo == "email":
        identificador = normalizar_email(credenciais.identificador)
        filtro = Usuario.email == identificador
        mensagem = "E-mail ou senha incorretos."
    else:
        identificador = digitos(credenciais.identificador)
        filtro = Usuario.telefone_digitos == identificador
        mensagem = "Telefone ou senha incorretos."

    chave = f"{credenciais.tipo}:{identificador}"
    # Navegador onde esta conta já entrou: tem contagem própria (ver limite_login.py).
    chave_contagem = limite_login.chave_do_dispositivo(chave, dispositivo) or chave
    if minutos := limite_login.minutos_bloqueado(chave_contagem):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Muitas tentativas de login. Tente novamente em {minutos} min.",
        )

    usuario = db.scalar(select(Usuario).where(filtro))
    # Mensagem igual para "não existe" e "senha errada": não revela quais contas existem.
    if not conferir_senha(usuario.senha_hash if usuario else None, credenciais.senha):
        limite_login.registrar_falha(chave_contagem)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, mensagem)

    limite_login.registrar_sucesso(chave, chave_contagem)
    abrir_sessao(db, usuario, resposta)
    resposta.set_cookie(
        config.COOKIE_DISPOSITIVO,
        limite_login.novo_dispositivo(chave),
        max_age=config.DISPOSITIVO_DIAS * 24 * 3600,
        httponly=True,
        secure=config.COOKIE_SEGURO,
        samesite="lax",
        path="/api/auth",
    )
    return usuario_saida(usuario)


@rota.post("/google", response_model=UsuarioSaida)
def entrar_com_google(dados: LoginGoogle, db: DB, resposta: Response):
    if not config.GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Login com Google ainda não configurado.")

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        info = id_token.verify_oauth2_token(
            dados.credencial, google_requests.Request(), config.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Não foi possível entrar com o Google.")

    sub = info["sub"]
    # E-mail não verificado pelo Google pode ser de outra pessoa: não ocupa o e-mail no sistema.
    email = normalizar_email(info.get("email", "")) if info.get("email_verified") else ""
    email = email or None
    usuario = db.scalar(select(Usuario).where(Usuario.google_sub == sub))

    if not usuario:
        existente = db.scalar(select(Usuario).where(Usuario.email == email)) if email else None
        if existente:
            # DECISÃO PENDENTE: vincular automaticamente contas com o mesmo e-mail?
            # Por segurança, por enquanto não vincula.
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Já existe uma conta com este e-mail. Entre com e-mail e senha.",
            )
        usuario = Usuario(
            id=str(uuid.uuid4()),
            nome=(info.get("name") or (email or "Cliente").split("@")[0])[:120],
            email=email,
            papel="cliente",
            provedor="google",
            google_sub=sub,
            criado_em=agora_utc(),
        )
        db.add(usuario)
        try:
            db.commit()
        except IntegrityError:
            # Dois logins simultâneos da mesma conta Google: usa a que foi criada primeiro.
            db.rollback()
            usuario = db.scalar(select(Usuario).where(Usuario.google_sub == sub))
            if not usuario:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    "Já existe uma conta com este e-mail. Entre com e-mail e senha.",
                )

    abrir_sessao(db, usuario, resposta)
    return usuario_saida(usuario)


@rota.post("/sair", status_code=status.HTTP_204_NO_CONTENT)
def sair(db: DB, resposta: Response, token: TokenSessao = None):
    encerrar_sessao(db, token, resposta)


@rota.get("/eu", response_model=UsuarioSaida)
def eu(usuario: UsuarioLogado):
    return usuario_saida(usuario)
