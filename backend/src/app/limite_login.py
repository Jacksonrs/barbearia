"""Limite de tentativas de login erradas, por conta (e-mail ou telefone).

Depois de MAX_FALHAS senhas erradas para a mesma conta dentro de JANELA, o login
dessa conta fica bloqueado até a falha mais antiga sair da janela. Um login certo
zera a contagem.

A contagem é por conta e não por IP: atrás do proxy do Vite (ou de um proxy em
produção) todos os acessos chegam com o mesmo IP, e bloquear o IP travaria todo mundo.

Dispositivo confiável: quem já entrou nesta conta por este navegador recebe um cookie
assinado. Com ele, as tentativas desse navegador são contadas à parte, então alguém
errando a senha de propósito em outro lugar não tranca o dono da conta para fora.

Fica na memória do processo: some ao reiniciar o servidor e vale para UM processo
(o caso do SQLite). Com vários processos, mover para o banco ou para o Redis.
"""
import hashlib
import hmac
import math
import secrets
import threading
import time
from collections import deque

from . import config

MAX_FALHAS = 5
JANELA_SEG = 15 * 60
# De quanto em quanto tempo as contas sem falhas recentes saem da memória.
VARREDURA_SEG = 60

_falhas: dict[str, deque[float]] = {}
_trava = threading.Lock()
_ultima_varredura = 0.0


def _limpar_antigas(fila: deque[float], agora: float) -> None:
    while fila and agora - fila[0] >= JANELA_SEG:
        fila.popleft()


def _varrer(agora: float) -> None:
    """Remove as contas cujas falhas já saíram da janela (chame com a trava)."""
    global _ultima_varredura
    if agora - _ultima_varredura < VARREDURA_SEG:
        return
    _ultima_varredura = agora
    for chave in list(_falhas):
        fila = _falhas[chave]
        _limpar_antigas(fila, agora)
        if not fila:
            del _falhas[chave]


def minutos_bloqueado(chave: str) -> int:
    """0 se pode tentar; senão, quantos minutos faltam para liberar."""
    agora = time.monotonic()
    with _trava:
        fila = _falhas.get(chave)
        if not fila:
            return 0
        _limpar_antigas(fila, agora)
        if len(fila) < MAX_FALHAS:
            return 0
        return max(1, math.ceil((fila[0] + JANELA_SEG - agora) / 60))


def registrar_falha(chave: str) -> None:
    agora = time.monotonic()
    with _trava:
        _varrer(agora)
        fila = _falhas.setdefault(chave, deque())
        _limpar_antigas(fila, agora)
        fila.append(agora)


def registrar_sucesso(*chaves: str) -> None:
    with _trava:
        for chave in chaves:
            _falhas.pop(chave, None)


def zerar() -> None:
    """Usado pelos testes."""
    global _ultima_varredura
    with _trava:
        _falhas.clear()
        _ultima_varredura = 0.0


# ---------- dispositivo confiável ----------


def _assinatura(chave: str, nonce: str) -> str:
    return hmac.new(config.SEGREDO.encode(), f"{chave}|{nonce}".encode(), hashlib.sha256).hexdigest()


def novo_dispositivo(chave: str) -> str:
    """Valor do cookie que marca este navegador como confiável para a conta `chave`."""
    nonce = secrets.token_urlsafe(16)
    return f"{nonce}.{_assinatura(chave, nonce)}"


def chave_do_dispositivo(chave: str, cookie: str | None) -> str | None:
    """Chave de contagem própria do navegador, se o cookie for válido para esta conta."""
    if not cookie or "." not in cookie:
        return None
    nonce, assinatura = cookie.split(".", 1)
    if not hmac.compare_digest(assinatura, _assinatura(chave, nonce)):
        return None
    return f"{chave}|{nonce}"
