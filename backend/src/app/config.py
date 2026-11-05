"""Configurações lidas de variáveis de ambiente (com padrões para desenvolvimento)."""
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[3]

DATABASE_URL = os.getenv(
    "DATABASE_URL", f"sqlite:///{RAIZ_REPOSITORIO / 'database' / 'barbearia.db'}"
)

# Todas as regras de horário ("30 min antes", "2h antes") usam o fuso da barbearia.
FUSO = ZoneInfo(os.getenv("FUSO", "America/Sao_Paulo"))

# Sessão
COOKIE_SESSAO = "jrbarber_sessao"
SESSAO_DIAS = int(os.getenv("SESSAO_DIAS", "30"))
# Em produção (HTTPS) deve ser "1".
COOKIE_SEGURO = os.getenv("COOKIE_SEGURO", "0") == "1"

# Login com Google: sem o Client ID, a rota responde 501.
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Conta do dono criada no primeiro start (troque a senha em produção!).
DONO_EMAIL = os.getenv("DONO_EMAIL", "dono@jrbarber.com")
DONO_SENHA = os.getenv("DONO_SENHA", "jrbarber123")

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
