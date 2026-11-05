/**
 * Login, cadastro e sessão, pelo backend (/api/auth).
 * A sessão é um cookie httpOnly criado pelo backend: o front só pergunta quem está logado.
 */
import type { Credenciais, DadosCadastro, Usuario } from '../types/usuario.ts'
import { api, enviar, ErroApi } from './api.ts'

/** Usuário da sessão atual, ou null se ninguém estiver logado. */
export async function sessaoAtual(): Promise<Usuario | null> {
  try {
    return await api<Usuario>('/auth/eu')
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) return null
    throw e
  }
}

export const entrar = (credenciais: Credenciais) => api<Usuario>('/auth/entrar', enviar(credenciais))

export const cadastrar = (dados: DadosCadastro) => api<Usuario>('/auth/cadastro', enviar(dados))

/**
 * O backend espera o ID token do Google (POST /auth/google com { credencial }),
 * que só o botão oficial do Google fornece. Até ele ser configurado, avisa na tela.
 */
export async function entrarComGoogle(): Promise<Usuario> {
  throw new ErroApi('Login com Google ainda não configurado.', 501)
}

export const sair = () => api<void>('/auth/sair', { method: 'POST' })
