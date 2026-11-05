import { Link } from 'react-router-dom'

const servicos = [
  { nome: 'Corte', descricao: 'Corte masculino na tesoura ou máquina.' },
  { nome: 'Barba', descricao: 'Barba feita com toalha quente e navalha.' },
  { nome: 'Corte + Barba', descricao: 'O combo completo.' },
]

export default function Inicio() {
  return (
    <>
      <section className="destaque">
        <h1>Jr Barber</h1>
        <p>Seu horário marcado, sem fila e sem espera.</p>
        <Link to="/agendar" className="botao">
          Agendar horário
        </Link>
      </section>

      <section>
        <h2>Serviços</h2>
        <ul className="servicos">
          {servicos.map((servico) => (
            <li key={servico.nome} className="cartao">
              <h3>{servico.nome}</h3>
              <p>{servico.descricao}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
