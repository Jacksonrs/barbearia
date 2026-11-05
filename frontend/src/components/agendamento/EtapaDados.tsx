import { useState, type ReactNode } from 'react'
import type { DadosCliente } from '../../types/agendamento.ts'
import { formatarTelefone, type ErrosCliente } from '../../utils/cliente.ts'

const LIMITE_OBSERVACAO = 200

type Props = {
  cliente: DadosCliente
  erros: ErrosCliente
  mostrarTodosErros: boolean
  onAlterar: (campo: keyof DadosCliente, valor: string) => void
}

type CampoProps = {
  campo: keyof DadosCliente
  rotulo: string
  opcional?: boolean
  erro?: string
  dica?: ReactNode
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

function Campo({ campo, rotulo, opcional, erro, dica, children }: CampoProps) {
  const id = `cliente-${campo}`
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

export default function EtapaDados({ cliente, erros, mostrarTodosErros, onAlterar }: Props) {
  const [tocados, setTocados] = useState<Partial<Record<keyof DadosCliente, boolean>>>({})
  const tocar = (campo: keyof DadosCliente) => () => setTocados((t) => ({ ...t, [campo]: true }))
  const erroVisivel = (campo: keyof DadosCliente) =>
    mostrarTodosErros || tocados[campo] ? erros[campo] : undefined

  return (
    <div className="campos">
      <Campo campo="nome" rotulo="Nome completo" erro={erroVisivel('nome')}>
        {(props) => (
          <input
            {...props}
            type="text"
            autoComplete="name"
            value={cliente.nome}
            onChange={(e) => onAlterar('nome', e.target.value)}
            onBlur={tocar('nome')}
          />
        )}
      </Campo>

      <Campo
        campo="telefone"
        rotulo="Telefone / WhatsApp"
        erro={erroVisivel('telefone')}
        dica="Com DDD. Usado para confirmar o horário."
      >
        {(props) => (
          <input
            {...props}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            value={cliente.telefone}
            onChange={(e) => onAlterar('telefone', formatarTelefone(e.target.value))}
            onBlur={tocar('telefone')}
          />
        )}
      </Campo>

      <Campo campo="email" rotulo="E-mail" opcional erro={erroVisivel('email')}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={cliente.email}
            onChange={(e) => onAlterar('email', e.target.value)}
            onBlur={tocar('email')}
          />
        )}
      </Campo>

      <Campo
        campo="observacao"
        rotulo="Observação"
        opcional
        dica={`${cliente.observacao.length}/${LIMITE_OBSERVACAO}`}
      >
        {(props) => (
          <textarea
            {...props}
            rows={3}
            maxLength={LIMITE_OBSERVACAO}
            placeholder="Algum pedido especial?"
            value={cliente.observacao}
            onChange={(e) => onAlterar('observacao', e.target.value)}
          />
        )}
      </Campo>
    </div>
  )
}
