import { createContext, useContext } from 'react'
import type { Credenciais, DadosCadastro, Usuario } from '../types/usuario.ts'

export type ContextoAuth = {
  usuario: Usuario | null
  /** true enquanto pergunta ao backend quem está logado (ao abrir o site). */
  carregando: boolean
  entrar: (credenciais: Credenciais) => Promise<Usuario>
  entrarComGoogle: () => Promise<Usuario>
  cadastrar: (dados: DadosCadastro) => Promise<Usuario>
  sair: () => Promise<void>
}

export const AuthContext = createContext<ContextoAuth | null>(null)

export function useAuth(): ContextoAuth {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return contexto
}

/** Para telas que só abrem com login (dentro de <RotaProtegida>). */
export function useUsuarioLogado(): Usuario {
  const { usuario } = useAuth()
  if (!usuario) throw new Error('Esta tela exige login.')
  return usuario
}

/** Para onde ir depois de entrar: a página que pediu o login, ou a área de cada perfil. */
export function destinoAposEntrar(usuario: Usuario, voltar: string | null): string {
  if (voltar?.startsWith('/') && !voltar.startsWith('//')) return voltar
  return usuario.papel === 'dono' ? '/painel' : '/meus-agendamentos'
}
