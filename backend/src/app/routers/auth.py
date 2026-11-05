import uuid

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from .. import config
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

    if db.scalar(select(Usuario).where(Usuario.telefone_digitos == telefone_digitos)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este telefone. Tente entrar.")
    if email and db.scalar(select(Usuario).where(Usuario.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este e-mail. Tente entrar.")

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
    db.commit()
    abrir_sessao(db, usuario, resposta)
    return usuario_saida(usuario)


@rota.post("/entrar", response_model=UsuarioSaida)
def entrar(credenciais: Credenciais, db: DB, resposta: Response):
    if credenciais.tipo == "email":
        filtro = Usuario.email == normalizar_email(credenciais.identificador)
        mensagem = "E-mail ou senha incorretos."
    else:
        filtro = Usuario.telefone_digitos == digitos(credenciais.identificador)
        mensagem = "Telefone ou senha incorretos."

    usuario = db.scalar(select(Usuario).where(filtro))
    # Mensagem igual para "não existe" e "senha errada": não revela quais contas existem.
    if not conferir_senha(usuario.senha_hash if usuario else None, credenciais.senha):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, mensagem)

    abrir_sessao(db, usuario, resposta)
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
    email = normalizar_email(info.get("email", "")) or None
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
            nome=info.get("name") or (email or "Cliente").split("@")[0],
            email=email,
            papel="cliente",
            provedor="google",
            google_sub=sub,
            criado_em=agora_utc(),
        )
        db.add(usuario)
        db.commit()

    abrir_sessao(db, usuario, resposta)
    return usuario_saida(usuario)


@rota.post("/sair", status_code=status.HTTP_204_NO_CONTENT)
def sair(db: DB, resposta: Response, token: TokenSessao = None):
    encerrar_sessao(db, token, resposta)


@rota.get("/eu", response_model=UsuarioSaida)
def eu(usuario: UsuarioLogado):
    return usuario_saida(usuario)
