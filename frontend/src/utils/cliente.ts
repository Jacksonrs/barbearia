import type { DadosCliente } from '../types/agendamento.ts'

/** Aplica a máscara (00) 00000-0000 enquanto o usuário digita. */
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export type ErrosCliente = Partial<Record<keyof DadosCliente, string>>

export function validarCliente(cliente: DadosCliente): ErrosCliente {
  const erros: ErrosCliente = {}

  if (cliente.nome.trim().length < 3) {
    erros.nome = 'Informe seu nome.'
  }

  const digitos = cliente.telefone.replace(/\D/g, '').length
  if (digitos === 0) {
    erros.telefone = 'Informe seu telefone.'
  } else if (digitos < 10) {
    erros.telefone = 'Telefone incompleto. Inclua o DDD.'
  }

  if (cliente.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email.trim())) {
    erros.email = 'E-mail inválido.'
  }

  return erros
}
