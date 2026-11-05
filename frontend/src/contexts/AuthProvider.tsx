import { useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../services/authApi.ts'
import type { Usuario } from '../types/usuario.ts'
import { AuthContext, type ContextoAuth } from './auth.ts'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => authApi.sessaoAtual())

  const valor = useMemo<ContextoAuth>(() => {
    const comSessao =
      <A extends unknown[]>(acao: (...args: A) => Promise<Usuario>) =>
      async (...args: A) => {
        const u = await acao(...args)
        setUsuario(u)
        return u
      }

    return {
      usuario,
      entrar: comSessao(authApi.entrar),
      entrarComGoogle: comSessao(authApi.entrarComGoogle),
      cadastrar: comSessao(authApi.cadastrar),
      sair: () => {
        authApi.sair()
        setUsuario(null)
      },
    }
  }, [usuario])

  return <AuthContext value={valor}>{children}</AuthContext>
}
