"""Configurações lidas de variáveis de ambiente (com padrões para desenvolvimento)."""
import os
import secrets
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[3]

DATABASE_URL = os.getenv(
    "DATABASE_URL", f"sqlite:///{RAIZ_REPOSITORIO / 'database' / 'barbearia.db'}"
)
# Neon/Render entregam "postgres://" ou "postgresql://"; o SQLAlchemy precisa
# saber que o driver é o psycopg 3.
for _prefixo in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefixo):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_prefixo):]
        break

# Todas as regras de horário ("30 min antes", "2h antes") usam o fuso da barbearia.
FUSO = ZoneInfo(os.getenv("FUSO", "America/Sao_Paulo"))

# Sessão
COOKIE_SESSAO = "jrbarber_sessao"
SESSAO_DIAS = int(os.getenv("SESSAO_DIAS", "30"))
# Em produção (HTTPS) deve ser "1".
COOKIE_SEGURO = os.getenv("COOKIE_SEGURO", "0") == "1"

# Navegador onde a conta já entrou (ver limite_login.py).
COOKIE_DISPOSITIVO = "jrbarber_dispositivo"
DISPOSITIVO_DIAS = 180
# Assina o cookie do dispositivo. Sem a variável, muda a cada start (os navegadores só
# perdem o "confiável" e voltam à contagem normal). Em produção, defina um valor fixo.
SEGREDO = os.getenv("SEGREDO") or secrets.token_hex(32)

# Login com Google: sem o Client ID, a rota responde 501.
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Conta do dono criada no primeiro start. A senha padrão só serve para desenvolvimento:
# com COOKIE_SEGURO=1 o servidor não sobe enquanto o dono usar essa senha (ver seed.py).
DONO_EMAIL = os.getenv("DONO_EMAIL", "dono@jrbarber.com")
DONO_SENHA_PADRAO = "jrbarber123"
DONO_SENHA = os.getenv("DONO_SENHA", DONO_SENHA_PADRAO)

# Regras de agendamento (iguais às do frontend).
INTERVALO_MIN = 30
ANTECEDENCIA_AGENDAR_MIN = 30
ANTECEDENCIA_CANCELAMENTO_MIN = 120
DIAS_AGENDAMENTO = 14
DURACOES_PERMITIDAS = (15, 30, 45, 60, 75, 90, 120)
SEM_PREFERENCIA = "sem-preferencia"


def agora() -> datetime:
    """Data e hora atuais no fuso da barbearia. Nos testes é substituída."""
    return datetime.now(FUSO)
