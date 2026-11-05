import { Loader2 } from 'lucide-react'
import { useState } from 'react'

type Props = {
  onConfirmar: () => Promise<void>
}

/** Botão "Cancelar" com confirmação no próprio card (sem janela por cima, bom no celular). */
export default function CancelarAgendamento({ onConfirmar }: Props) {
  const [estado, setEstado] = useState<'parado' | 'confirmando' | 'enviando'>('parado')
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar() {
    setErro(null)
    setEstado('enviando')
    try {
      await onConfirmar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar.')
      setEstado('confirmando')
    }
  }

  if (estado === 'parado') {
    return (
      <button type="button" className="botao-perigo" onClick={() => setEstado('confirmando')}>
        Cancelar agendamento
      </button>
    )
  }

  return (
    <div className="confirmar-cancelamento" role="group" aria-label="Confirmar cancelamento">
      <p>Cancelar este horário?</p>
      {erro && (
        <p className="campo-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="confirmar-cancelamento-acoes">
        <button
          type="button"
          className="botao botao--secundario botao--pequeno"
          onClick={() => setEstado('parado')}
          disabled={estado === 'enviando'}
        >
          Manter
        </button>
        <button
          type="button"
          className="botao botao--perigo botao--pequeno"
          onClick={() => void confirmar()}
          disabled={estado === 'enviando'}
        >
          {estado === 'enviando' && <Loader2 size={16} className="girando" aria-hidden="true" />}
          Sim, cancelar
        </button>
      </div>
    </div>
  )
}
