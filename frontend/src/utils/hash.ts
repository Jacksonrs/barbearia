/** Hash simples e determinístico (mesma entrada → mesmo número). Usado só para gerar dados de exemplo. */
export function hash(texto: string): number {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
