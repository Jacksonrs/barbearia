import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../services/authApi.ts'
import type { Usuario } from '../types/usuario.ts'
import { AuthContext, type ContextoAuth } from './auth.ts'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // A sessão fica num cookie que só o backend lê: ao abrir o site, pergunta quem está logado.
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    authApi
      .sessaoAtual()
      .catch(() => null) // Sem conexão: segue como visitante.
      .then((u) => {
        if (!ativo) return
        setUsuario(u)
        setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

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
      carregando,
      entrar: comSessao(authApi.entrar),
      entrarComGoogle: comSessao(authApi.entrarComGoogle),
      cadastrar: comSessao(authApi.cadastrar),
      sair: async () => {
        try {
          await authApi.sair()
        } catch {
          // Mesmo sem resposta do backend, a tela volta para "deslogado".
        }
        setUsuario(null)
      },
    }
  }, [usuario, carregando])

  return <AuthContext value={valor}>{children}</AuthContext>
}
