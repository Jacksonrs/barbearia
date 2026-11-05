import { Check, Users } from 'lucide-react'
import { SEM_PREFERENCIA, type Barbeiro } from '../../types/agendamento.ts'

type Props = {
  barbeiros: Barbeiro[]
  selecionado: string | null
  onSelecionar: (id: string) => void
}

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function EtapaBarbeiro({ barbeiros, selecionado, onSelecionar }: Props) {
  const opcoes = [
    {
      id: SEM_PREFERENCIA,
      nome: 'Sem preferência',
      descricao: 'Primeiro barbeiro livre no horário escolhido.',
      avatar: <Users size={22} />,
    },
    ...barbeiros.map((b) => ({
      id: b.id,
      nome: b.nome,
      descricao: b.especialidade,
      avatar: iniciais(b.nome),
    })),
  ]

  return (
    <fieldset className="grupo">
      <legend className="visualmente-oculto">Barbeiro</legend>
      <div className="opcoes opcoes--grade">
        {opcoes.map((opcao) => {
          const id = `barbeiro-${opcao.id}`
          return (
            <label key={opcao.id} className="opcao">
              <input
                type="radio"
                name="barbeiro"
                className="visualmente-oculto"
                checked={selecionado === opcao.id}
                onChange={() => onSelecionar(opcao.id)}
                aria-labelledby={`${id}-titulo`}
                aria-describedby={`${id}-descricao`}
              />
              <span className="avatar" aria-hidden="true">
                {opcao.avatar}
              </span>
              <span className="opcao-corpo">
                <span id={`${id}-titulo`} className="opcao-titulo">
                  {opcao.nome}
                </span>
                <span id={`${id}-descricao`} className="opcao-descricao">
                  {opcao.descricao}
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
