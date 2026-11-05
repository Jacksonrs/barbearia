import { useState } from 'react'
import type { DadosCliente } from '../../types/agendamento.ts'
import { formatarTelefone, type ErrosCliente } from '../../utils/cliente.ts'
import Campo from '../Campo.tsx'

const LIMITE_OBSERVACAO = 200

type Props = {
  cliente: DadosCliente
  erros: ErrosCliente
  mostrarTodosErros: boolean
  onAlterar: (campo: keyof DadosCliente, valor: string) => void
}

/** Os dados já vêm preenchidos com a conta do cliente; ele só confere ou ajusta. */
export default function EtapaDados({ cliente, erros, mostrarTodosErros, onAlterar }: Props) {
  const [tocados, setTocados] = useState<Partial<Record<keyof DadosCliente, boolean>>>({})
  const tocar = (campo: keyof DadosCliente) => () => setTocados((t) => ({ ...t, [campo]: true }))
  const erroVisivel = (campo: keyof DadosCliente) =>
    mostrarTodosErros || tocados[campo] ? erros[campo] : undefined

  return (
    <div className="campos">
      <Campo id="cliente-nome" rotulo="Nome completo" erro={erroVisivel('nome')}>
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
        id="cliente-telefone"
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

      <Campo id="cliente-email" rotulo="E-mail" opcional erro={erroVisivel('email')}>
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
        id="cliente-observacao"
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
