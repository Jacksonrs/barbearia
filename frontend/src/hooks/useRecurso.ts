import { useEffect, useEffectEvent, useState } from 'react'

type Resultado<T> = { chave: string; dados?: T; erro?: string }

/**
 * Carrega dados assíncronos sempre que `chave` muda.
 * Com `chave` nula nada é carregado (útil quando falta uma escolha anterior).
 */
export function useRecurso<T>(chave: string | null, carregar: () => Promise<T>) {
  const [tentativa, setTentativa] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const chaveAtual = chave === null ? null : `${chave}#${tentativa}`

  const buscar = useEffectEvent(carregar)

  useEffect(() => {
    if (chaveAtual === null) return
    let ativo = true

    buscar().then(
      (dados) => {
        if (ativo) setResultado({ chave: chaveAtual, dados })
      },
      (erro: unknown) => {
        if (ativo) {
          const mensagem = erro instanceof Error ? erro.message : 'Não foi possível carregar.'
          setResultado({ chave: chaveAtual, erro: mensagem })
        }
      },
    )

    return () => {
      ativo = false
    }
  }, [chaveAtual])

  const atual = resultado?.chave === chaveAtual ? resultado : null

  return {
    dados: atual?.dados,
    erro: atual?.erro,
    carregando: chaveAtual !== null && atual === null,
    recarregar: () => setTentativa((t) => t + 1),
  }
}
