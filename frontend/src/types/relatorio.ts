/** Relatório do painel (GET /api/painel/relatorio). Valores em centavos. */

export type ItemRelatorio = {
  id: string
  nome: string
  quantidade: number
  faturamentoCentavos: number
}

export type Relatorio = {
  /** Formato AAAA-MM-DD (as duas datas entram no período). */
  inicio: string
  fim: string
  /** Agendamentos confirmados (os cancelados ficam de fora de todos os outros números). */
  agendamentos: number
  cancelados: number
  canceladosPeloCliente: number
  /** Soma dos preços dos confirmados, com o preço do dia em que cada um foi marcado. */
  faturamentoCentavos: number
  /** Parte do faturamento de horários que já passaram. */
  faturamentoRealizadoCentavos: number
  ticketMedioCentavos: number
  clientes: number
  /** Clientes cujo primeiro agendamento na barbearia caiu no período. */
  clientesNovos: number
  porServico: ItemRelatorio[]
  porBarbeiro: ItemRelatorio[]
  /** 7 posições, 0 = domingo. */
  porDiaSemana: number[]
  /** Hora cheia ("09:00") em que os atendimentos começam. */
  porHora: { hora: string; quantidade: number }[]
  /** Todos os dias do período, inclusive os sem movimento. */
  porDia: { data: string; quantidade: number; faturamentoCentavos: number }[]
  clientesFrequentes: { nome: string; telefone: string; quantidade: number }[]
}
