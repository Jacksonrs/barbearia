/**
 * Painel do dono, pelo backend (/api/painel). Toda rota exige o papel "dono" (senão 403).
 */
import type { Agendamento, Servico } from '../types/agendamento.ts'
import type { Relatorio } from '../types/relatorio.ts'
import { api, enviar } from './api.ts'

/** Todos os agendamentos do dia (inclusive cancelados), em ordem de horário. */
export const agendaDoDia = (data: string) =>
  api<Agendamento[]>(`/painel/agenda?${new URLSearchParams({ data })}`)

/** Números do período entre `inicio` e `fim` (AAAA-MM-DD, as duas inclusive; até 1 ano). */
export const obterRelatorio = (inicio: string, fim: string) =>
  api<Relatorio>(`/painel/relatorio?${new URLSearchParams({ inicio, fim })}`)

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
