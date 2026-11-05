import type { Papel } from './usuario.ts'

/** Valor usado quando o cliente não escolhe um barbeiro específico. */
export const SEM_PREFERENCIA = 'sem-preferencia'

export type Servico = {
  id: string
  nome: string
  descricao: string
  duracaoMin: number
  /** Serviços inativos não aparecem para os clientes, mas continuam no histórico. */
  ativo: boolean
}

export type Barbeiro = {
  id: string
  nome: string
  especialidade: string
}

export type Horario = {
  /** Formato HH:MM */
  hora: string
  disponivel: boolean
}

/** Horário de funcionamento da barbearia (GET /api/funcionamento). */
export type Funcionamento = {
  /** Intervalo entre um horário e outro na agenda, em minutos. */
  intervaloMin: number
  /** Quantos dias à frente o cliente pode agendar (a partir de hoje). */
  diasAgendamento: number
  /** Um item por dia da semana (0 = domingo, igual ao getDay()); null = fechado. */
  dias: ({ abre: string; fecha: string } | null)[]
}

export type DadosCliente = {
  nome: string
  telefone: string
  email: string
  observacao: string
}

export type NovoAgendamento = {
  servicoId: string
  /** Id do barbeiro ou SEM_PREFERENCIA */
  barbeiroId: string
  /** Formato AAAA-MM-DD */
  data: string
  /** Formato HH:MM */
  hora: string
  cliente: DadosCliente
}

export type StatusAgendamento = 'confirmado' | 'cancelado'

export type Agendamento = {
  id: string
  clienteId: string
  servicoId: string
  /** Nome do serviço no momento do agendamento (o serviço pode ser renomeado depois). */
  servicoNome: string
  /** Barbeiro que vai atender (definido pelo sistema quando o cliente não tem preferência). */
  barbeiroId: string
  data: string
  hora: string
  duracaoMin: number
  cliente: DadosCliente
  status: StatusAgendamento
  criadoEm: string
  canceladoPor?: Papel
}
