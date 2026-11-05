import { Crown, Scissors, Sparkles, type LucideIcon } from 'lucide-react'

const icones: Record<string, LucideIcon> = {
  corte: Scissors,
  barba: Sparkles,
  'corte-barba': Crown,
}

/** Ícone de cada serviço; serviços novos criados pelo dono usam a tesoura. */
export const iconeDoServico = (id: string): LucideIcon => icones[id] ?? Scissors
