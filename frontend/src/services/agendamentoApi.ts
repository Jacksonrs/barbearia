/**
 * Camada de acesso aos dados do agendamento.
 *
 * Por enquanto tudo é SIMULADO no navegador (dadosExemplo.ts). Quando o backend
 * estiver pronto, troque o corpo de cada função por um fetch para a API,
 * mantendo as mesmas assinaturas — as telas não precisam mudar.
 * Os endpoints esperados estão descritos no README do frontend.
 */
import {
  SEM_PREFERENCIA,
  type AgendamentoConfirmado,
  type Barbeiro,
  type Horario,
  type NovoAgendamento,
  type Servico,
} from '../types/agendamento.ts'
import { deIso, horaParaMinutos, minutosParaHora, paraIso } from '../utils/datas.ts'
import {
  barbeirosExemplo,
  funcionamentoExemplo,
  INTERVALO_MIN,
  servicosExemplo,
} from './dadosExemplo.ts'

/** Atraso simulado de rede (zerado nos testes). */
const ATRASO_MS = import.meta.env.MODE === 'test' ? 0 : 450
const esperar = () => new Promise((resolver) => setTimeout(resolver, ATRASO_MS))

/** Antecedência mínima para agendar no mesmo dia, em minutos. */
const ANTECEDENCIA_MIN = 30

/** Blocos de agenda reservados nesta sessão: "data|barbeiro|minuto". */
const reservados = new Set<string>()

/** Hash simples e determinístico, para simular uma agenda já parcialmente ocupada. */
function hash(texto: string): number {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

function blocoOcupado(data: string, barbeiroId: string, minuto: number): boolean {
  const chave = `${data}|${barbeiroId}|${minuto}`
  return reservados.has(chave) || hash(chave) % 100 < 30
}

function barbeiroLivre(data: string, barbeiroId: string, inicio: number, duracao: number): boolean {
  for (let m = inicio; m < inicio + duracao; m += INTERVALO_MIN) {
    if (blocoOcupado(data, barbeiroId, m)) return false
  }
  return true
}

function candidatos(barbeiroId: string): string[] {
  return barbeiroId === SEM_PREFERENCIA ? barbeirosExemplo.map((b) => b.id) : [barbeiroId]
}

/** Indica se a barbearia abre nesse dia. */
export function diaAberto(data: Date): boolean {
  return funcionamentoExemplo[data.getDay()] !== null
}

export async function listarServicos(): Promise<Servico[]> {
  await esperar()
  return servicosExemplo
}

export async function listarBarbeiros(): Promise<Barbeiro[]> {
  await esperar()
  return barbeirosExemplo
}

export async function listarHorarios(
  data: string,
  servicoId: string,
  barbeiroId: string,
): Promise<Horario[]> {
  await esperar()

  const servico = servicosExemplo.find((s) => s.id === servicoId)
  const expediente = funcionamentoExemplo[deIso(data).getDay()]
  if (!servico || !expediente) return []

  const agora = new Date()
  const limiteHoje =
    data === paraIso(agora) ? agora.getHours() * 60 + agora.getMinutes() + ANTECEDENCIA_MIN : -1

  const horarios: Horario[] = []
  for (let m = expediente.abre; m + servico.duracaoMin <= expediente.fecha; m += INTERVALO_MIN) {
    const disponivel =
      m >= limiteHoje &&
      candidatos(barbeiroId).some((id) => barbeiroLivre(data, id, m, servico.duracaoMin))
    horarios.push({ hora: minutosParaHora(m), disponivel })
  }
  return horarios
}

export async function criarAgendamento(novo: NovoAgendamento): Promise<AgendamentoConfirmado> {
  await esperar()

  const servico = servicosExemplo.find((s) => s.id === novo.servicoId)
  if (!servico) throw new Error('Serviço não encontrado.')

  const inicio = horaParaMinutos(novo.hora)
  const barbeiroIdFinal = candidatos(novo.barbeiroId).find((id) =>
    barbeiroLivre(novo.data, id, inicio, servico.duracaoMin),
  )
  if (!barbeiroIdFinal) {
    throw new Error('Esse horário acabou de ser ocupado. Escolha outro horário.')
  }

  for (let m = inicio; m < inicio + servico.duracaoMin; m += INTERVALO_MIN) {
    reservados.add(`${novo.data}|${barbeiroIdFinal}|${m}`)
  }

  return {
    ...novo,
    id: `JR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    barbeiroIdFinal,
  }
}
