"""Formatos de entrada e saída da API — espelham frontend/src/types/.

Os campos são escritos em snake_case no Python e trafegam em camelCase no JSON
(ex.: duracao_min ↔ "duracaoMin"). As mensagens de erro são mostradas ao usuário
pelo front, por isso estão em português.
"""
import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

from . import config
from .utils import digitos

Papel = Literal["cliente", "dono"]

RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
RE_HORA = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
# R$ 1.000,00: acima disso é quase certo erro de digitação.
PRECO_MAXIMO_CENTAVOS = 100_000


class Esquema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---------- validações compartilhadas (mesmas de frontend/src/utils/cliente.ts) ----------


def validar_nome(nome: str) -> str:
    nome = nome.strip()
    if len(nome) < 3:
        raise ValueError("Informe seu nome.")
    if len(nome) > 120:
        raise ValueError("Nome muito longo.")
    return nome


def validar_telefone(telefone: str) -> str:
    n = len(digitos(telefone))
    if n == 0:
        raise ValueError("Informe seu telefone.")
    if n < 10:
        raise ValueError("Telefone incompleto. Inclua o DDD.")
    # O texto é guardado como digitado (coluna de 20 caracteres): limita também a máscara.
    if n > 11 or len(telefone.strip()) > 20:
        raise ValueError("Telefone inválido.")
    return telefone.strip()


def validar_email_opcional(email: str) -> str:
    email = email.strip()
    if email and (len(email) > 254 or not RE_EMAIL.match(email)):
        raise ValueError("E-mail inválido.")
    return email


# ---------- contas ----------


class UsuarioSaida(Esquema):
    id: str
    nome: str
    telefone: str
    email: str
    papel: Papel
    provedor: Literal["senha", "google"]


class Credenciais(Esquema):
    tipo: Literal["email", "telefone"]
    identificador: str
    senha: str


class DadosCadastro(Esquema):
    nome: str
    telefone: str
    email: str = ""
    senha: str

    _nome = field_validator("nome")(validar_nome)
    _telefone = field_validator("telefone")(validar_telefone)
    _email = field_validator("email")(validar_email_opcional)

    @field_validator("senha")
    @classmethod
    def _senha(cls, senha: str) -> str:
        if len(senha) < 6:
            raise ValueError("A senha precisa ter pelo menos 6 caracteres.")
        if len(senha) > 128:
            raise ValueError("Senha muito longa.")
        return senha


class LoginGoogle(Esquema):
    # ID token devolvido pelo Google Identity Services no navegador.
    credencial: str


# ---------- agendamento ----------


class ServicoSaida(Esquema):
    id: str
    nome: str
    descricao: str
    duracao_min: int
    preco_centavos: int
    ativo: bool


class DadosServico(Esquema):
    nome: str
    descricao: str
    duracao_min: int
    preco_centavos: int = 0
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def _nome(cls, nome: str) -> str:
        nome = nome.strip()
        if len(nome) < 2:
            raise ValueError("Informe o nome do serviço.")
        if len(nome) > 40:
            raise ValueError("O nome pode ter no máximo 40 caracteres.")
        return nome

    @field_validator("descricao")
    @classmethod
    def _descricao(cls, descricao: str) -> str:
        descricao = descricao.strip()
        if len(descricao) < 5:
            raise ValueError("Escreva uma descrição curta.")
        if len(descricao) > 120:
            raise ValueError("A descrição pode ter no máximo 120 caracteres.")
        return descricao

    @field_validator("duracao_min")
    @classmethod
    def _duracao(cls, duracao: int) -> int:
        if duracao not in config.DURACOES_PERMITIDAS:
            raise ValueError("Duração inválida.")
        return duracao

    @field_validator("preco_centavos")
    @classmethod
    def _preco(cls, preco: int) -> int:
        if not 0 <= preco <= PRECO_MAXIMO_CENTAVOS:
            raise ValueError("Preço inválido.")
        return preco


class BarbeiroSaida(Esquema):
    id: str
    nome: str
    especialidade: str


class HorarioSaida(Esquema):
    hora: str
    disponivel: bool


class DiaFuncionamento(Esquema):
    abre: str  # HH:MM
    fecha: str  # HH:MM


class Funcionamento(Esquema):
    intervalo_min: int
    dias_agendamento: int
    # 7 posições, 0 = domingo; null = fechado.
    dias: list[DiaFuncionamento | None]


class ClienteSaida(Esquema):
    nome: str
    telefone: str
    email: str = ""
    observacao: str = ""


class DadosCliente(ClienteSaida):
    _nome = field_validator("nome")(validar_nome)
    _telefone = field_validator("telefone")(validar_telefone)
    _email = field_validator("email")(validar_email_opcional)

    @field_validator("observacao")
    @classmethod
    def _observacao(cls, observacao: str) -> str:
        observacao = observacao.strip()
        if len(observacao) > 200:
            raise ValueError("A observação pode ter no máximo 200 caracteres.")
        return observacao


class NovoAgendamento(Esquema):
    servico_id: str
    barbeiro_id: str  # id do barbeiro ou "sem-preferencia"
    data: date
    hora: str
    cliente: DadosCliente

    @field_validator("hora")
    @classmethod
    def _hora(cls, hora: str) -> str:
        if not RE_HORA.match(hora):
            raise ValueError("Horário inválido.")
        return hora


class AgendamentoSaida(Esquema):
    id: str
    cliente_id: str
    servico_id: str
    servico_nome: str
    barbeiro_id: str
    data: date
    hora: str
    duracao_min: int
    cliente: ClienteSaida
    status: Literal["confirmado", "cancelado"]
    criado_em: datetime
    cancelado_por: Papel | None = None
