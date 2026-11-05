/**
 * Painel do dono, pelo backend (/api/painel). Toda rota exige o papel "dono" (senão 403).
 */
import type { Agendamento, Servico } from '../types/agendamento.ts'
import { api, enviar } from './api.ts'

/** Todos os agendamentos do dia (inclusive cancelados), em ordem de horário. */
export const agendaDoDia = (data: string) =>
  api<Agendamento[]>(`/painel/agenda?${new URLSearchParams({ data })}`)

/** Todos os serviços, inclusive os inativos. */
export const listarTodosServicos = () => api<Servico[]>('/painel/servicos')

export type DadosServico = Omit<Servico, 'id'>

/** Cria (sem `id`) ou atualiza (com `id`) um serviço. */
export function salvarServico(dados: DadosServico, id?: string): Promise<Servico> {
  if (!id) return api<Servico>('/painel/servicos', enviar(dados))
  return api<Servico>(`/painel/servicos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}
