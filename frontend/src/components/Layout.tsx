import {
  CalendarCheck,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Scissors,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { areaDoUsuario, useAuth } from '../contexts/auth.ts'
import { useAvisos } from '../contexts/avisos.ts'

const anoAtual = new Date().getFullYear()

const links = [
  { para: '/', rotulo: 'Início' },
  { para: '/#servicos', rotulo: 'Serviços' },
  { para: '/#como-funciona', rotulo: 'Como funciona' },
]

function Marca({ para }: { para: string }) {
  return (
    <Link to={para} className="marca" aria-label="Jr Barber — início">
      <span className="marca-icone" aria-hidden="true">
        <Scissors size={18} strokeWidth={2.2} />
      </span>
      <span className="marca-nome">
        Jr <span>Barber</span>
      </span>
    </Link>
  )
}

/**
 * Rola até a seção do link (#servicos) ou volta ao topo ao trocar de página.
 * Depende também de `key`: clicar de novo no mesmo link (ex.: "Serviços" depois de
 * rolar para longe) gera uma nova navegação para o mesmo endereço e precisa rolar outra vez.
 */
function useRolagemPorRota() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, hash, key])
}

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)
  const { usuario, sair } = useAuth()
  const navegar = useNavigate()
  const avisar = useAvisos()

  // Logado, o "início" é a área da conta; a página inicial pública é só para visitantes.
  const inicio = usuario ? areaDoUsuario(usuario) : '/'

  // Ao sair, volta para a página inicial pública. Vai para lá ANTES de encerrar a sessão
  // (se fosse depois, a tela protegida mandaria para /entrar); `saindo` avisa o início
  // para não devolver o usuário à área da conta nesse meio-tempo. Com `replace`, o botão
  // "voltar" não reabre a área que exige login.
  async function sairDaConta() {
    fecharMenu()
    navegar('/', { replace: true, state: { saindo: true } })
    await sair()
    navegar('/', { replace: true }) // Limpa a marca `saindo` do histórico.
    avisar('Você saiu da sua conta.', 'info')
  }

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
          <Marca para={inicio} />

          <nav
            id="menu-principal"
            className={`menu ${menuAberto ? 'menu--aberto' : ''}`}
            aria-label="Principal"
          >
            {!usuario && (
              <>
                {links.map((link) => (
                  <Link key={link.para} to={link.para} onClick={fecharMenu}>
                    {link.rotulo}
                  </Link>
                ))}
                <span className="menu-separador" aria-hidden="true" />
              </>
            )}

            {usuario ? (
              <>
                {usuario.papel === 'dono' ? (
                  <NavLink to="/painel" onClick={fecharMenu}>
                    <LayoutDashboard size={17} aria-hidden="true" /> Painel
                  </NavLink>
                ) : (
                  <NavLink to="/meus-agendamentos" onClick={fecharMenu}>
                    <CalendarCheck size={17} aria-hidden="true" /> Meus agendamentos
                  </NavLink>
                )}
                <button type="button" className="menu-link-botao" onClick={() => void sairDaConta()}>
                  <LogOut size={17} aria-hidden="true" /> Sair
                </button>
              </>
            ) : (
              <NavLink to="/entrar" onClick={fecharMenu}>
                <LogIn size={17} aria-hidden="true" /> Entrar
              </NavLink>
            )}

            {usuario?.papel !== 'dono' && (
              <Link to="/agendar" className="botao botao--pequeno" onClick={fecharMenu}>
                Agendar
              </Link>
            )}
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
            <Marca para={inicio} />
            <p className="rodape-texto">Corte, barba e cuidado masculino com hora marcada.</p>
          </div>
          <nav className="rodape-links" aria-label="Rodapé">
            {usuario?.papel === 'dono' ? (
              <Link to="/painel">Painel</Link>
            ) : usuario ? (
              <>
                <Link to="/meus-agendamentos">Meus agendamentos</Link>
                <Link to="/agendar">Agendar</Link>
              </>
            ) : (
              <>
                {links.map((link) => (
                  <Link key={link.para} to={link.para}>
                    {link.rotulo}
                  </Link>
                ))}
                <Link to="/agendar">Agendar</Link>
              </>
            )}
          </nav>
        </div>
        <div className="container rodape-base">© {anoAtual} Jr Barber. Todos os direitos reservados.</div>
      </footer>
    </div>
  )
}
