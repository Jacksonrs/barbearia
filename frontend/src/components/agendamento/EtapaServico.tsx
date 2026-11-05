import { Check, Clock } from 'lucide-react'
import type { Servico } from '../../types/agendamento.ts'
import { formatarDuracao } from '../../utils/datas.ts'
import { iconeDoServico } from './iconesServico.ts'

type Props = {
  servicos: Servico[]
  selecionado: string | null
  onSelecionar: (id: string) => void
}

export default function EtapaServico({ servicos, selecionado, onSelecionar }: Props) {
  return (
    <fieldset className="grupo">
      <legend className="visualmente-oculto">Serviço</legend>
      <div className="opcoes">
        {servicos.map((servico) => {
          const Icone = iconeDoServico(servico.id)
          const id = `servico-${servico.id}`
          return (
            <label key={servico.id} className="opcao">
              <input
                type="radio"
                name="servico"
                className="visualmente-oculto"
                checked={selecionado === servico.id}
                onChange={() => onSelecionar(servico.id)}
                aria-labelledby={`${id}-titulo`}
                aria-describedby={`${id}-descricao`}
              />
              <span className="opcao-icone" aria-hidden="true">
                <Icone size={22} />
              </span>
              <span className="opcao-corpo">
                <span id={`${id}-titulo`} className="opcao-titulo">
                  {servico.nome}
                </span>
                <span id={`${id}-descricao`} className="opcao-descricao">
                  {servico.descricao}
                </span>
                <span className="opcao-meta">
                  <Clock size={14} aria-hidden="true" /> {formatarDuracao(servico.duracaoMin)}
                </span>
              </span>
              <span className="opcao-check" aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
