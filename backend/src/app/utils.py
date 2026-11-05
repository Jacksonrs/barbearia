import re
import unicodedata
from datetime import UTC, datetime


def digitos(texto: str) -> str:
    return re.sub(r"\D", "", texto)


def normalizar_email(email: str) -> str:
    return email.strip().lower()


def hora_para_minutos(hora: str) -> int:
    h, m = hora.split(":")
    return int(h) * 60 + int(m)


def minutos_para_hora(minutos: int) -> str:
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def slug(texto: str) -> str:
    """"Corte + Barba" → "corte-barba" (mesma regra do frontend)."""
    sem_acento = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sem_acento.lower()).strip("-") or "servico"


def agora_utc() -> datetime:
    """Para carimbos internos (criação, expiração). Sem fuso, sempre em UTC."""
    return datetime.now(UTC).replace(tzinfo=None)


def dia_semana(data) -> int:
    """0 = domingo ... 6 = sábado (como o getDay() do JavaScript)."""
    return (data.weekday() + 1) % 7
