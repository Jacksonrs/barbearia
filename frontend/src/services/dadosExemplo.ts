/**
 * DADOS DE EXEMPLO — usados enquanto o backend não está pronto.
 * Nomes, serviços e horários de funcionamento são fictícios e devem ser
 * substituídos pelos dados reais da Jr Barber (vindos da API).
 */
import type { Barbeiro, Servico } from '../types/agendamento.ts'

export const servicosExemplo: Servico[] = [
  {
    id: 'corte',
    nome: 'Corte',
    descricao: 'Na tesoura ou na máquina, com acabamento na navalha.',
    duracaoMin: 30,
  },
  {
    id: 'barba',
    nome: 'Barba',
    descricao: 'Toalha quente, navalha e hidratação.',
    duracaoMin: 30,
  },
  {
    id: 'corte-barba',
    nome: 'Corte + Barba',
    descricao: 'O serviço completo em um único horário.',
    duracaoMin: 60,
  },
]

export const barbeirosExemplo: Barbeiro[] = [
  { id: 'junior', nome: 'Junior', especialidade: 'Cortes clássicos e degradê' },
  { id: 'rafael', nome: 'Rafael', especialidade: 'Barba e navalha' },
  { id: 'lucas', nome: 'Lucas', especialidade: 'Cortes modernos' },
]

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
