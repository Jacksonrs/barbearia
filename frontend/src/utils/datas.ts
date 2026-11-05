const LOCALE = 'pt-BR'

/** Date → "AAAA-MM-DD" usando o fuso local (sem conversão para UTC). */
export function paraIso(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** "AAAA-MM-DD" → Date no fuso local. */
export function deIso(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function proximosDias(quantidade: number, inicio = new Date()): Date[] {
  return Array.from(
    { length: quantidade },
    (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i),
  )
}

const semCurto = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })
const mesCurto = new Intl.DateTimeFormat(LOCALE, { month: 'short' })
const dataLonga = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

const semPonto = (texto: string) => texto.replace('.', '')

export const formatarDiaSemanaCurto = (data: Date) => semPonto(semCurto.format(data))
export const formatarMesCurto = (data: Date) => semPonto(mesCurto.format(data))
export const formatarDataLonga = (iso: string) => dataLonga.format(deIso(iso))

const dataCurta = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
/** Ex.: "sex, 6 de nov" */
export const formatarDataCurta = (iso: string) => dataCurta.format(deIso(iso)).replaceAll('.', '')

export function minutosParaHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `${h}h ${m}min` : `${h}h`
}
