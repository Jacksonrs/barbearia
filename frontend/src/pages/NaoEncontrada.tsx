import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <section>
      <h1>Página não encontrada</h1>
      <p>
        <Link to="/">Voltar para o início</Link>
      </p>
    </section>
  )
}
