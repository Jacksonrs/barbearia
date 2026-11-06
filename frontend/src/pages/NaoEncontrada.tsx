import { Link } from 'react-router-dom'
import { useTitulo } from '../hooks/useTitulo.ts'

export default function NaoEncontrada() {
  useTitulo('Página não encontrada')
  return (
    <section className="secao">
      <div className="container pagina-estreita nao-encontrada">
        <span className="nao-encontrada-codigo">404</span>
        <h1>Página não encontrada</h1>
        <p>O endereço que você acessou não existe ou foi alterado.</p>
        <Link to="/" className="botao">
          Voltar para o início
        </Link>
      </div>
    </section>
  )
}
