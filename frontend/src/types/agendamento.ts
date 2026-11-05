/** Valor usado quando o cliente não escolhe um barbeiro específico. */
export const SEM_PREFERENCIA = 'sem-preferencia'

export type Servico = {
  id: string
  nome: string
  descricao: string
  duracaoMin: number
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

export type AgendamentoConfirmado = NovoAgendamento & {
  id: string
  /** Barbeiro que vai atender (definido pelo sistema quando é SEM_PREFERENCIA) */
  barbeiroIdFinal: string
}
