import { useEffect } from 'react'

const NOME_SITE = 'Jr Barber'

/** Título da aba do navegador (aparece também no histórico e nos favoritos). */
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${NOME_SITE}` : `${NOME_SITE} · Barbearia com agendamento online`
  }, [titulo])
}
