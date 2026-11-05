import { NavLink, Outlet } from 'react-router-dom'

const anoAtual = new Date().getFullYear()

export default function Layout() {
  return (
    <div className="layout">
      <header className="cabecalho">
        <NavLink to="/" className="marca">
          Jr Barber
        </NavLink>
        <nav className="menu">
          <NavLink to="/" end>
            Início
          </NavLink>
          <NavLink to="/agendar">Agendar</NavLink>
        </nav>
      </header>

      <main className="conteudo">
        <Outlet />
      </main>

      <footer className="rodape">
        © {anoAtual} Jr Barber
      </footer>
    </div>
  )
}
