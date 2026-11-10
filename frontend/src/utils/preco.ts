const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** R$ 1.000,00 — igual ao limite do backend. */
export const PRECO_MAXIMO_CENTAVOS = 100_000

/** 4500 → "R$ 45,00". */
export const formatarPreco = (centavos: number) => MOEDA.format(centavos / 100)

/** 4500 → "45,00", para preencher o campo de preço. 0 (sem preço) vira campo vazio. */
export const precoParaCampo = (centavos: number) =>
  centavos > 0 ? (centavos / 100).toFixed(2).replace('.', ',') : ''

/**
 * Lê o que foi digitado no campo de preço e devolve em centavos, ou null se não der para entender.
 * Aceita "45", "45,5", "45,50", "R$ 45,50", "1.200,00" e também "45.50".
 */
export function lerPreco(texto: string): number | null {
  let t = texto.replace(/R\$|\s/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  return Math.round(Number(t) * 100)
}
