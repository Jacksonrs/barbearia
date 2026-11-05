import { Menu, Scissors, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const anoAtual = new Date().getFullYear()

const links = [
  { para: '/', rotulo: 'Início' },
  { para: '/#servicos', rotulo: 'Serviços' },
  { para: '/#como-funciona', rotulo: 'Como funciona' },
]

function Marca() {
  return (
    <Link to="/" className="marca" aria-label="Jr Barber — início">
      <span className="marca-icone" aria-hidden="true">
        <Scissors size={18} strokeWidth={2.2} />
      </span>
      <span className="marca-nome">
        Jr <span>Barber</span>
      </span>
    </Link>
  )
}

/** Rola até a seção do link (#servicos) ou volta ao topo ao trocar de página. */
function useRolagemPorRota() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, hash])
}

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)

  useRolagemPorRota()

  // Com o menu do celular aberto: Esc fecha e a página de trás não rola.
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.classList.add('sem-rolagem')
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.classList.remove('sem-rolagem')
    }
  }, [menuAberto])

  return (
    <div className="layout">
      <header className="cabecalho">
        <div className="container cabecalho-interno">
          <Marca />

          <nav
            id="menu-principal"
            className={`menu ${menuAberto ? 'menu--aberto' : ''}`}
            aria-label="Principal"
          >
            {links.map((link) => (
              <Link key={link.para} to={link.para} onClick={fecharMenu}>
                {link.rotulo}
              </Link>
            ))}
            <Link to="/agendar" className="botao botao--pequeno" onClick={fecharMenu}>
              Agendar
            </Link>
          </nav>

          <button
            type="button"
            className="menu-botao"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuAberto && <div className="menu-fundo" onClick={fecharMenu} aria-hidden="true" />}

      <main className="conteudo">
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="container rodape-interno">
          <div>
            <Marca />
            <p className="rodape-texto">Corte, barba e cuidado masculino com hora marcada.</p>
          </div>
          <nav className="rodape-links" aria-label="Rodapé">
            {links.map((link) => (
              <Link key={link.para} to={link.para}>
                {link.rotulo}
              </Link>
            ))}
            <Link to="/agendar">Agendar</Link>
          </nav>
        </div>
        <div className="container rodape-base">© {anoAtual} Jr Barber. Todos os direitos reservados.</div>
      </footer>
    </div>
  )
}
