import { CalendarDays, Scissors } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

export default function Painel() {
  return (
    <section className="secao secao--compacta">
      <div className="container">
        <header className="secao-cabecalho secao-cabecalho--esquerda">
          <span className="etiqueta">Área do dono</span>
          <h1>Painel da barbearia</h1>
        </header>

        <nav className="abas" aria-label="Seções do painel">
          <NavLink to="/painel" end>
            <CalendarDays size={18} aria-hidden="true" /> Agenda do dia
          </NavLink>
          <NavLink to="/painel/servicos">
            <Scissors size={18} aria-hidden="true" /> Serviços
          </NavLink>
        </nav>

        <Outlet />
      </div>
    </section>
  )
}
