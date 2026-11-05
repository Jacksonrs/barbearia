/**
 * DADOS DE EXEMPLO — usados enquanto o backend não está pronto.
 * Nomes, serviços, horários, clientes e a conta do dono são fictícios e devem
 * ser substituídos pelos dados reais da Jr Barber (vindos da API).
 */
import type { Agendamento, Barbeiro, Servico } from '../types/agendamento.ts'
import { minutosParaHora, paraIso } from '../utils/datas.ts'
import { hash } from '../utils/hash.ts'

export const servicosExemplo: Servico[] = [
  {
    id: 'corte',
    nome: 'Corte',
    descricao: 'Na tesoura ou na máquina, com acabamento na navalha.',
    duracaoMin: 30,
    ativo: true,
  },
  {
    id: 'barba',
    nome: 'Barba',
    descricao: 'Toalha quente, navalha e hidratação.',
    duracaoMin: 30,
    ativo: true,
  },
  {
    id: 'corte-barba',
    nome: 'Corte + Barba',
    descricao: 'O serviço completo em um único horário.',
    duracaoMin: 60,
    ativo: true,
  },
]

export const barbeirosExemplo: Barbeiro[] = [
  { id: 'junior', nome: 'Junior', especialidade: 'Cortes clássicos e degradê' },
  { id: 'rafael', nome: 'Rafael', especialidade: 'Barba e navalha' },
  { id: 'lucas', nome: 'Lucas', especialidade: 'Cortes modernos' },
]

/** Conta do dono para testes. Em produção, isso vem do backend. */
export const donoExemplo = {
  id: 'dono',
  nome: 'Administrador',
  email: 'dono@jrbarber.com',
  telefone: '',
  senha: 'jrbarber123',
}

/** Intervalo entre um horário e outro na agenda, em minutos. */
export const INTERVALO_MIN = 30

type Expediente = { abre: number; fecha: number } | null

/** Horário de funcionamento por dia da semana (0 = domingo), em minutos desde 00:00. */
export const funcionamentoExemplo: Expediente[] = [
  null, // domingo — fechado
  null, // segunda — fechado
  { abre: 9 * 60, fecha: 19 * 60 },
  { abre: 9 * 60, fecha: 19 * 60 },
  { abre: 9 * 60, fecha: 19 * 60 },
  { abre: 9 * 60, fecha: 19 * 60 },
  { abre: 8 * 60, fecha: 16 * 60 }, // sábado
]

const nomesClientesExemplo = [
  'Carlos Mendes',
  'Bruno Almeida',
  'Diego Rocha',
  'Felipe Costa',
  'Gustavo Lima',
  'Henrique Dias',
  'Igor Martins',
  'João Pedro Silva',
  'Leonardo Souza',
  'Marcos Vinícius',
  'Pedro Henrique',
  'Thiago Ribeiro',
]

/**
 * Gera uma agenda já parcialmente ocupada (da semana passada até daqui a 2 semanas),
 * para o painel do dono e os horários ocupados parecerem reais.
 */
export function gerarAgendamentosExemplo(hoje = new Date()): Agendamento[] {
  const lista: Agendamento[] = []
  const criadoEm = new Date().toISOString()

  for (let d = -7; d <= 13; d++) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + d)
    const expediente = funcionamentoExemplo[dia.getDay()]
    if (!expediente) continue
    const data = paraIso(dia)

    for (const barbeiro of barbeirosExemplo) {
      let minuto = expediente.abre
      while (minuto < expediente.fecha) {
        const h = hash(`${data}|${barbeiro.id}|${minuto}`)
        const servico = servicosExemplo[(h >>> 7) % servicosExemplo.length]
        if (h % 100 < 30 && minuto + servico.duracaoMin <= expediente.fecha) {
          const n = (h >>> 3) % 10000
          lista.push({
            id: `EX-${lista.length + 1}`,
            clienteId: 'exemplo',
            servicoId: servico.id,
            servicoNome: servico.nome,
            barbeiroId: barbeiro.id,
            data,
            hora: minutosParaHora(minuto),
            duracaoMin: servico.duracaoMin,
            cliente: {
              nome: nomesClientesExemplo[(h >>> 11) % nomesClientesExemplo.length],
              telefone: `(11) 9${String(n).padStart(4, '0')}-${String((n * 7) % 10000).padStart(4, '0')}`,
              email: '',
              observacao: '',
            },
            status: 'confirmado',
            criadoEm,
          })
          minuto += servico.duracaoMin
        } else {
          minuto += INTERVALO_MIN
        }
      }
    }
  }
  return lista
}
