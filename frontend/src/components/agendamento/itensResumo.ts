import { CalendarDays, Clock, Scissors, UserRound, type LucideIcon } from 'lucide-react'

export type ItemResumo = {
  rotulo: string
  valor: string | null
  icone: LucideIcon
}

export function itensResumo(dados: {
  servico: string | null
  barbeiro: string | null
  data: string | null
  hora: string | null
}): ItemResumo[] {
  return [
    { rotulo: 'Serviço', valor: dados.servico, icone: Scissors },
    { rotulo: 'Barbeiro', valor: dados.barbeiro, icone: UserRound },
    { rotulo: 'Data', valor: dados.data, icone: CalendarDays },
    { rotulo: 'Horário', valor: dados.hora, icone: Clock },
  ]
}
