import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ANTECEDENCIA_CANCELAMENTO_MIN } from '../../services/agendamentoApi.ts'
import type { ItemResumo } from './itensResumo.ts'
import { ListaResumo } from './Resumo.tsx'

type Props = {
  codigo: string
  nomeCliente: string
  itens: ItemResumo[]
  onNovo: () => void
}

export default function Confirmado({ codigo, nomeCliente, itens, onNovo }: Props) {
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primeiroNome = nomeCliente.trim().split(' ')[0]

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  return (
    <div className="painel confirmado">
      <span className="confirmado-icone" aria-hidden="true">
        <CircleCheck size={40} />
      </span>
      <h2 ref={tituloRef} tabIndex={-1}>
        Agendamento confirmado!
      </h2>
      <p className="confirmado-texto">
        Tudo certo, {primeiroNome}. Chegue com alguns minutos de antecedência.
      </p>

      <div className="confirmado-cartao">
        <div className="confirmado-codigo">
          <span>Código</span>
          <strong>{codigo}</strong>
        </div>
        <ListaResumo itens={itens} />
      </div>

      <p className="confirmado-nota">
        Você pode ver ou cancelar este horário em “Meus agendamentos” (até{' '}
        {ANTECEDENCIA_CANCELAMENTO_MIN / 60}h antes).
      </p>

      <div className="confirmado-acoes">
        <button type="button" className="botao botao--secundario" onClick={onNovo}>
          Fazer outro agendamento
        </button>
        <Link to="/meus-agendamentos" className="botao">
          Ver meus agendamentos
        </Link>
      </div>
    </div>
  )
}
