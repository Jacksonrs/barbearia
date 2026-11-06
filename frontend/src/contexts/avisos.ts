import { createContext, useContext } from 'react'

export type TipoAviso = 'sucesso' | 'erro' | 'info'

export type Aviso = { id: number; texto: string; tipo: TipoAviso }

/** Mostra uma mensagem rápida no canto da tela (some sozinha depois de alguns segundos). */
export type Avisar = (texto: string, tipo?: TipoAviso) => void

export const AvisosContext = createContext<Avisar | null>(null)

export function useAvisos(): Avisar {
  const avisar = useContext(AvisosContext)
  if (!avisar) throw new Error('useAvisos precisa estar dentro de <AvisosProvider>.')
  return avisar
}
