import { useEffect, useEffectEvent, useState } from 'react'

type Resultado<T> = { chave: string; tentativa: number; dados?: T; erro?: string }

/**
 * Carrega dados assíncronos sempre que `chave` muda.
 * Com `chave` nula nada é carregado (útil quando falta uma escolha anterior).
 *
 * Ao `recarregar` a mesma chave (ex.: depois de cancelar um item), os dados antigos
 * continuam na tela até os novos chegarem: a lista não "pisca" virando esqueleto.
 */
export function useRecurso<T>(chave: string | null, carregar: () => Promise<T>) {
  const [tentativa, setTentativa] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)

  const buscar = useEffectEvent(carregar)

  useEffect(() => {
    if (chave === null) return
    let ativo = true

    buscar().then(
      (dados) => {
        if (ativo) setResultado({ chave, tentativa, dados })
      },
      (erro: unknown) => {
        if (!ativo) return
        const mensagem = erro instanceof Error ? erro.message : 'Não foi possível carregar.'
        // Se a recarga falhar, mantém o que já estava na tela e mostra o erro junto.
        setResultado((anterior) => ({
          chave,
          tentativa,
          erro: mensagem,
          dados: anterior?.chave === chave ? anterior.dados : undefined,
        }))
      },
    )

    return () => {
      ativo = false
    }
  }, [chave, tentativa])

  const daChave = chave !== null && resultado?.chave === chave ? resultado : null
  const emDia = daChave?.tentativa === tentativa

  return {
    dados: daChave?.dados,
    erro: emDia ? daChave?.erro : undefined,
    /** Primeira carga (ou nova tentativa após erro): ainda não há nada para mostrar. */
    carregando: chave !== null && !emDia && daChave?.dados === undefined,
    /** Recarregando, mas com os dados anteriores ainda na tela. */
    atualizando: chave !== null && !emDia && daChave?.dados !== undefined,
    recarregar: () => setTentativa((t) => t + 1),
  }
}
