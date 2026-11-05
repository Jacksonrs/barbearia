/**
 * Agendamentos do ponto de vista do cliente, pelo backend (/api).
 * O cliente é sempre o usuário da sessão: o backend não aceita um id vindo do front.
 */
import type {
  Agendamento,
  Barbeiro,
  Funcionamento,
  Horario,
  NovoAgendamento,
  Servico,
} from '../types/agendamento.ts'
import { deIso, horaParaMinutos } from '../utils/datas.ts'
import { api, enviar } from './api.ts'

/** O cliente só pode cancelar até esse tempo antes do horário, em minutos (o backend confere). */
export const ANTECEDENCIA_CANCELAMENTO_MIN = 120

export function inicioAgendamento(agendamento: Pick<Agendamento, 'data' | 'hora'>): Date {
  const data = deIso(agendamento.data)
  const minutos = horaParaMinutos(agendamento.hora)
  data.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
  return data
}

export const obterFuncionamento = () => api<Funcionamento>('/funcionamento')

/** Indica se a barbearia abre nesse dia. */
export const diaAberto = (data: Date, funcionamento: Funcionamento) =>
  funcionamento.dias[data.getDay()] != null

/** Serviços disponíveis para agendar (só os ativos). */
export const listarServicos = () => api<Servico[]>('/servicos')

export const listarBarbeiros = () => api<Barbeiro[]>('/barbeiros')

export function listarHorarios(data: string, servicoId: string, barbeiroId: string) {
  const busca = new URLSearchParams({ data, servico: servicoId, barbeiro: barbeiroId })
  return api<Horario[]>(`/horarios?${busca}`)
}

export const criarAgendamento = (novo: NovoAgendamento) => api<Agendamento>('/agendamentos', enviar(novo))

export const listarMeusAgendamentos = () => api<Agendamento[]>('/agendamentos/meus')

/**
 * Regra do cliente: só agendamentos confirmados e com antecedência mínima.
 * Serve para mostrar ou esconder o botão; quem decide de verdade é o backend.
 */
export function podeCancelar(agendamento: Agendamento, agora = new Date()): boolean {
  return (
    agendamento.status === 'confirmado' &&
    inicioAgendamento(agendamento).getTime() - agora.getTime() >=
      ANTECEDENCIA_CANCELAMENTO_MIN * 60_000
  )
}

/** Cliente cancela os próprios agendamentos; o dono pode cancelar qualquer um. */
export const cancelarAgendamento = (id: string) =>
  api<void>(`/agendamentos/${encodeURIComponent(id)}/cancelar`, { method: 'POST' })
