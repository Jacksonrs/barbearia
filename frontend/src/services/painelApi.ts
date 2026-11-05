/**
 * Funções do painel do dono (SIMULADAS, como em agendamentoApi.ts).
 * No backend real, todas estas rotas precisam verificar se quem chama é o dono.
 */
import type { Agendamento, Servico } from '../types/agendamento.ts'
import { alterarBanco, lerBanco } from './armazenamento.ts'
import { esperar } from './rede.ts'

/** Todos os agendamentos do dia (inclusive cancelados), em ordem de horário. */
export async function agendaDoDia(data: string): Promise<Agendamento[]> {
  await esperar()
  return lerBanco()
    .agendamentos.filter((a) => a.data === data)
    .sort((a, b) => a.hora.localeCompare(b.hora))
}

/** Todos os serviços, inclusive os inativos. */
export async function listarTodosServicos(): Promise<Servico[]> {
  await esperar()
  return lerBanco().servicos
}

export type DadosServico = Omit<Servico, 'id'>

function gerarId(nome: string, existentes: Servico[]): string {
  const base =
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'servico'
  let id = base
  for (let n = 2; existentes.some((s) => s.id === id); n++) id = `${base}-${n}`
  return id
}

/** Cria (sem `id`) ou atualiza (com `id`) um serviço. */
export async function salvarServico(dados: DadosServico, id?: string): Promise<Servico> {
  await esperar()

  return alterarBanco((banco) => {
    const nome = dados.nome.trim()
    const descricao = dados.descricao.trim()
    const repetido = banco.servicos.some(
      (s) => s.id !== id && s.nome.toLowerCase() === nome.toLowerCase(),
    )
    if (repetido) throw new Error('Já existe um serviço com esse nome.')

    if (id) {
      const servico = banco.servicos.find((s) => s.id === id)
      if (!servico) throw new Error('Serviço não encontrado.')
      Object.assign(servico, { ...dados, nome, descricao })
      return { ...servico }
    }

    const novo: Servico = { ...dados, nome, descricao, id: gerarId(nome, banco.servicos) }
    banco.servicos.push(novo)
    return novo
  })
}
