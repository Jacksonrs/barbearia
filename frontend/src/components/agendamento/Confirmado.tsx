import { CalendarPlus, Check, CircleCheck, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisos } from '../../contexts/avisos.ts'
import { ANTECEDENCIA_CANCELAMENTO_MIN } from '../../services/agendamentoApi.ts'
import type { Agendamento } from '../../types/agendamento.ts'
import { baixarCalendario } from '../../utils/calendario.ts'
import type { ItemResumo } from './itensResumo.ts'
import { ListaResumo } from './Resumo.tsx'

type Props = {
  agendamento: Agendamento
  itens: ItemResumo[]
  onNovo: () => void
}

export default function Confirmado({ agendamento, itens, onNovo }: Props) {
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primeiroNome = agendamento.cliente.nome.trim().split(' ')[0]
  const avisar = useAvisos()
  const [copiado, setCopiado] = useState(false)
  const nomeBarbeiro = itens.find((i) => i.rotulo === 'Barbeiro')?.valor ?? null

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(agendamento.id)
      setCopiado(true)
    } catch {
      avisar('Não foi possível copiar. Anote o código: ' + agendamento.id, 'erro')
    }
  }

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
          <strong>{agendamento.id}</strong>
          <button
            type="button"
            className="botao-icone botao-icone--pequeno"
            onClick={() => void copiarCodigo()}
            aria-label={copiado ? 'Código copiado' : 'Copiar código'}
            title={copiado ? 'Copiado!' : 'Copiar código'}
          >
            {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          </button>
        </div>
        <ListaResumo itens={itens} />
      </div>

      <button
        type="button"
        className="botao-texto confirmado-agenda"
        onClick={() => baixarCalendario(agendamento, nomeBarbeiro)}
      >
        <CalendarPlus size={16} aria-hidden="true" /> Adicionar à minha agenda
      </button>

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
