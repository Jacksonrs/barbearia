import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ItemResumo } from './itensResumo.ts'

export function ListaResumo({ itens, id }: { itens: ItemResumo[]; id?: string }) {
  return (
    <dl id={id} className="resumo-lista">
      {itens.map(({ rotulo, valor, icone: Icone }) => (
        <div key={rotulo} className="resumo-linha">
          <dt>
            <Icone size={16} aria-hidden="true" />
            {rotulo}
          </dt>
          <dd className={valor ? undefined : 'resumo-vazio'}>{valor ?? 'A escolher'}</dd>
        </div>
      ))}
    </dl>
  )
}

type Props = {
  itens: ItemResumo[]
  /** Versão curta (ex.: "Corte · sex, 6 de nov · 09:00") mostrada no celular com o resumo fechado. */
  compacto: string
}

/**
 * No computador o resumo fica sempre aberto ao lado do formulário.
 * No celular vira uma barra de uma linha que abre e fecha, para não empurrar o conteúdo.
 */
export default function Resumo({ itens, compacto }: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <aside className={`resumo${aberto ? ' resumo--aberto' : ''}`} aria-label="Resumo do agendamento">
      <h2 className="resumo-titulo">Resumo</h2>
      <button
        type="button"
        className="resumo-alternar"
        aria-expanded={aberto}
        aria-controls="resumo-lista"
        onClick={() => setAberto((a) => !a)}
      >
        <span className="resumo-alternar-rotulo">Resumo</span>
        <span className="resumo-alternar-texto">{compacto || 'Nada escolhido ainda'}</span>
        <ChevronDown size={18} className="resumo-alternar-seta" aria-hidden="true" />
      </button>
      <ListaResumo id="resumo-lista" itens={itens} />
    </aside>
  )
}
