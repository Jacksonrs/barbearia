import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Agendar() {
  return (
    <section className="secao">
      <div className="container pagina-estreita">
        <header className="secao-cabecalho secao-cabecalho--esquerda">
          <span className="etiqueta">Agendamento</span>
          <h1>Agendar horário</h1>
          <p>Escolha o serviço, o barbeiro, o dia e o horário.</p>
        </header>

        <div className="aviso">
          <CalendarClock size={28} aria-hidden="true" />
          <div>
            <h2>Em breve</h2>
            <p>O agendamento online está sendo preparado.</p>
          </div>
        </div>

        <Link to="/" className="link-seta">
          Voltar para o início
        </Link>
      </div>
    </section>
  )
}
