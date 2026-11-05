"""Limite de tentativas de login erradas, por conta (e-mail ou telefone).

Depois de MAX_FALHAS senhas erradas para a mesma conta dentro de JANELA, o login
dessa conta fica bloqueado até a falha mais antiga sair da janela. Um login certo
zera a contagem.

A contagem é por conta e não por IP: atrás do proxy do Vite (ou de um proxy em
produção) todos os acessos chegam com o mesmo IP, e bloquear o IP travaria todo mundo.

Fica na memória do processo: some ao reiniciar o servidor e vale para UM processo
(o caso do SQLite). Com vários processos, mover para o banco ou para o Redis.
"""
import math
import threading
import time
from collections import deque

MAX_FALHAS = 5
JANELA_SEG = 15 * 60

_falhas: dict[str, deque[float]] = {}
_trava = threading.Lock()


def _limpar_antigas(fila: deque[float], agora: float) -> None:
    while fila and agora - fila[0] >= JANELA_SEG:
        fila.popleft()


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
        fila = _falhas.setdefault(chave, deque())
        _limpar_antigas(fila, agora)
        fila.append(agora)


def registrar_sucesso(chave: str) -> None:
    with _trava:
        _falhas.pop(chave, None)


def zerar() -> None:
    """Usado pelos testes."""
    with _trava:
        _falhas.clear()
