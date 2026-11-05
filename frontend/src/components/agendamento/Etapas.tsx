import { Check } from 'lucide-react'
import { ETAPAS } from './listaEtapas.ts'

type Props = {
  atual: number
  onIrPara: (etapa: number) => void
}

export default function Etapas({ atual, onIrPara }: Props) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="etapas">
        {ETAPAS.map((etapa, i) => {
          const estado = i < atual ? 'concluida' : i === atual ? 'atual' : 'futura'
          return (
            <li key={etapa.nome} className={`etapa etapa--${estado}`}>
              <button
                type="button"
                className="etapa-botao"
                onClick={() => onIrPara(i)}
                disabled={i >= atual}
                aria-current={i === atual ? 'step' : undefined}
              >
                <span className="etapa-marcador" aria-hidden="true">
                  {i < atual ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="etapa-nome">{etapa.nome}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
