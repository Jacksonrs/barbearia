import { inicioAgendamento } from '../services/agendamentoApi.ts'
import type { Agendamento } from '../types/agendamento.ts'

/** Date → "AAAAMMDDTHHMMSS" no horário local (formato de data do iCalendar). */
function paraIcs(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${data.getFullYear()}${p(data.getMonth() + 1)}${p(data.getDate())}` +
    `T${p(data.getHours())}${p(data.getMinutes())}00`
  )
}

/** Escapa o texto para dentro de um campo do .ics. */
const textoIcs = (texto: string) => texto.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

/**
 * Arquivo .ics do agendamento: abre no Google Agenda, no Calendário do iPhone/Mac e no Outlook.
 * Inclui um lembrete 1 hora antes.
 */
export function arquivoCalendario(agendamento: Agendamento, nomeBarbeiro: string | null): string {
  const inicio = inicioAgendamento(agendamento)
  const fim = new Date(inicio.getTime() + agendamento.duracaoMin * 60_000)
  const descricao = [
    `Código: ${agendamento.id}`,
    nomeBarbeiro && `Barbeiro: ${nomeBarbeiro}`,
    'Para cancelar, acesse "Meus agendamentos" no site.',
  ]
    .filter(Boolean)
    .join('\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jr Barber//Agendamento//PT-BR',
    'BEGIN:VEVENT',
    `UID:${agendamento.id}@jrbarber`,
    `DTSTAMP:${paraIcs(new Date())}`,
    `DTSTART:${paraIcs(inicio)}`,
    `DTEND:${paraIcs(fim)}`,
    `SUMMARY:${textoIcs(`${agendamento.servicoNome} · Jr Barber`)}`,
    `DESCRIPTION:${textoIcs(descricao)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Seu horário na Jr Barber é daqui a 1 hora',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Faz o navegador baixar o .ics (no celular, abre direto na agenda). */
export function baixarCalendario(agendamento: Agendamento, nomeBarbeiro: string | null) {
  const blob = new Blob([arquivoCalendario(agendamento, nomeBarbeiro)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `jr-barber-${agendamento.data}.ics`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
