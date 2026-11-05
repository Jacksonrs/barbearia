import type { ReactNode } from 'react'

type PropsControle = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

type Props = {
  id: string
  rotulo: string
  opcional?: boolean
  erro?: string
  dica?: ReactNode
  /** Recebe as props de acessibilidade para repassar ao input. */
  children: (props: PropsControle) => ReactNode
}

/** Rótulo + controle + mensagem de erro/dica, já ligados para leitores de tela. */
export default function Campo({ id, rotulo, opcional, erro, dica, children }: Props) {
  const descricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined
  return (
    <div className={`campo${erro ? ' campo--erro' : ''}`}>
      <label htmlFor={id} className="campo-rotulo">
        {rotulo}
        {opcional && <span className="campo-opcional">opcional</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': descricao })}
      {erro ? (
        <span id={`${id}-erro`} className="campo-erro">
          {erro}
        </span>
      ) : (
        dica && (
          <span id={`${id}-dica`} className="campo-dica">
            {dica}
          </span>
        )
      )}
    </div>
  )
}
