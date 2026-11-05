/**
 * Agendamentos do ponto de vista do cliente.
 *
 * Por enquanto tudo é SIMULADO no navegador (armazenamento.ts). Quando o backend
 * estiver pronto, troque o corpo de cada função por um fetch para a API,
 * mantendo as mesmas assinaturas — as telas não precisam mudar.
 * Os endpoints esperados estão descritos no README do frontend.
 */
import {
  SEM_PREFERENCIA,
  type Agendamento,
  type Barbeiro,
  type Horario,
  type NovoAgendamento,
  type Servico,
} from '../types/agendamento.ts'
import type { Usuario } from '../types/usuario.ts'
import { deIso, horaParaMinutos, minutosParaHora } from '../utils/datas.ts'
import { alterarBanco, lerBanco } from './armazenamento.ts'
import { funcionamentoExemplo, INTERVALO_MIN } from './dadosExemplo.ts'
import { esperar } from './rede.ts'

/** Antecedência mínima para agendar, em minutos. */
export const ANTECEDENCIA_AGENDAR_MIN = 30
/** O cliente só pode cancelar até esse tempo antes do horário, em minutos. */
export const ANTECEDENCIA_CANCELAMENTO_MIN = 120

export function inicioAgendamento(agendamento: Pick<Agendamento, 'data' | 'hora'>): Date {
  const data = deIso(agendamento.data)
  const minutos = horaParaMinutos(agendamento.hora)
  data.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
  return data
}

function barbeiroLivre(
  agendamentos: Agendamento[],
  data: string,
  barbeiroId: string,
  inicio: number,
  duracao: number,
): boolean {
  return !agendamentos.some((a) => {
    if (a.status !== 'confirmado' || a.data !== data || a.barbeiroId !== barbeiroId) return false
    const inicioOutro = horaParaMinutos(a.hora)
    return inicio < inicioOutro + a.duracaoMin && inicioOutro < inicio + duracao
  })
}

function candidatos(barbeiros: Barbeiro[], barbeiroId: string): string[] {
  return barbeiroId === SEM_PREFERENCIA ? barbeiros.map((b) => b.id) : [barbeiroId]
}

/** Indica se a barbearia abre nesse dia. */
export function diaAberto(data: Date): boolean {
  return funcionamentoExemplo[data.getDay()] !== null
}

/** Serviços disponíveis para agendar (só os ativos). */
export async function listarServicos(): Promise<Servico[]> {
  await esperar()
  return lerBanco().servicos.filter((s) => s.ativo)
}

export async function listarBarbeiros(): Promise<Barbeiro[]> {
  await esperar()
  return lerBanco().barbeiros
}

export async function listarHorarios(
  data: string,
  servicoId: string,
  barbeiroId: string,
): Promise<Horario[]> {
  await esperar()

  const { servicos, barbeiros, agendamentos } = lerBanco()
  const servico = servicos.find((s) => s.id === servicoId)
  const expediente = funcionamentoExemplo[deIso(data).getDay()]
  if (!servico || !expediente) return []

  const limite = Date.now() + ANTECEDENCIA_AGENDAR_MIN * 60_000
  const horarios: Horario[] = []
  for (let m = expediente.abre; m + servico.duracaoMin <= expediente.fecha; m += INTERVALO_MIN) {
    const hora = minutosParaHora(m)
    const disponivel =
      inicioAgendamento({ data, hora }).getTime() >= limite &&
      candidatos(barbeiros, barbeiroId).some((id) =>
        barbeiroLivre(agendamentos, data, id, m, servico.duracaoMin),
      )
    horarios.push({ hora, disponivel })
  }
  return horarios
}

export async function criarAgendamento(
  novo: NovoAgendamento,
  usuario: Usuario,
): Promise<Agendamento> {
  await esperar()

  return alterarBanco((banco) => {
    const servico = banco.servicos.find((s) => s.id === novo.servicoId && s.ativo)
    if (!servico) throw new Error('Este serviço não está mais disponível.')

    if (inicioAgendamento(novo).getTime() < Date.now() + ANTECEDENCIA_AGENDAR_MIN * 60_000) {
      throw new Error('Esse horário não está mais disponível. Escolha outro horário.')
    }

    const inicio = horaParaMinutos(novo.hora)
    const barbeiroId = candidatos(banco.barbeiros, novo.barbeiroId).find((id) =>
      barbeiroLivre(banco.agendamentos, novo.data, id, inicio, servico.duracaoMin),
    )
    if (!barbeiroId) {
      throw new Error('Esse horário acabou de ser ocupado. Escolha outro horário.')
    }

    const agendamento: Agendamento = {
      id: `JR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      clienteId: usuario.id,
      servicoId: servico.id,
      servicoNome: servico.nome,
      barbeiroId,
      data: novo.data,
      hora: novo.hora,
      duracaoMin: servico.duracaoMin,
      cliente: novo.cliente,
      status: 'confirmado',
      criadoEm: new Date().toISOString(),
    }
    banco.agendamentos.push(agendamento)

    // Contas do Google chegam sem telefone: guarda o informado no agendamento.
    const conta = banco.usuarios.find((u) => u.id === usuario.id)
    if (conta && !conta.telefone) conta.telefone = novo.cliente.telefone

    return agendamento
  })
}

export async function listarMeusAgendamentos(usuarioId: string): Promise<Agendamento[]> {
  await esperar()
  return lerBanco().agendamentos.filter((a) => a.clienteId === usuarioId)
}

/** Regra do cliente: só agendamentos confirmados e com antecedência mínima. */
export function podeCancelar(agendamento: Agendamento, agora = new Date()): boolean {
  return (
    agendamento.status === 'confirmado' &&
    inicioAgendamento(agendamento).getTime() - agora.getTime() >=
      ANTECEDENCIA_CANCELAMENTO_MIN * 60_000
  )
}

export async function cancelarAgendamento(id: string, usuario: Usuario): Promise<void> {
  await esperar()

  alterarBanco((banco) => {
    const agendamento = banco.agendamentos.find((a) => a.id === id)
    // O cliente só enxerga os próprios agendamentos.
    if (!agendamento || (usuario.papel === 'cliente' && agendamento.clienteId !== usuario.id)) {
      throw new Error('Agendamento não encontrado.')
    }
    if (agendamento.status !== 'confirmado') {
      throw new Error('Este agendamento já foi cancelado.')
    }
    if (usuario.papel === 'cliente' && !podeCancelar(agendamento)) {
      throw new Error(
        `O cancelamento só pode ser feito até ${ANTECEDENCIA_CANCELAMENTO_MIN / 60} horas antes do horário.`,
      )
    }
    agendamento.status = 'cancelado'
    agendamento.canceladoPor = usuario.papel
  })
}
