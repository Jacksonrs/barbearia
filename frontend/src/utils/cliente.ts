import type { DadosCliente } from '../types/agendamento.ts'
import type { DadosCadastro } from '../types/usuario.ts'

/** Aplica a máscara (00) 00000-0000 enquanto o usuário digita. */
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const SENHA_MINIMA = 6

export function erroNome(nome: string): string | undefined {
  return nome.trim().length < 3 ? 'Informe seu nome.' : undefined
}

export function erroTelefone(telefone: string): string | undefined {
  const digitos = telefone.replace(/\D/g, '').length
  if (digitos === 0) return 'Informe seu telefone.'
  if (digitos < 10) return 'Telefone incompleto. Inclua o DDD.'
  return undefined
}

export function erroEmail(email: string, obrigatorio = false): string | undefined {
  const valor = email.trim()
  if (!valor) return obrigatorio ? 'Informe seu e-mail.' : undefined
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? undefined : 'E-mail inválido.'
}

/** Remove as chaves sem erro, para `Object.keys(erros).length` dizer se há problemas. */
function limpar<T extends Record<string, string | undefined>>(erros: T): Partial<T> {
  return Object.fromEntries(Object.entries(erros).filter(([, v]) => v)) as Partial<T>
}

export type ErrosCliente = Partial<Record<keyof DadosCliente, string>>

export function validarCliente(cliente: DadosCliente): ErrosCliente {
  return limpar({
    nome: erroNome(cliente.nome),
    telefone: erroTelefone(cliente.telefone),
    email: erroEmail(cliente.email),
  })
}

export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>

export function validarCadastro(dados: DadosCadastro): ErrosCadastro {
  return limpar({
    nome: erroNome(dados.nome),
    telefone: erroTelefone(dados.telefone),
    email: erroEmail(dados.email),
    senha:
      dados.senha.length < SENHA_MINIMA
        ? `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
        : undefined,
  })
}
