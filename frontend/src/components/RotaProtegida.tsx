import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/auth.ts'
import type { Papel } from '../types/usuario.ts'
import CarregandoPagina from './CarregandoPagina.tsx'

type Props = {
  children: ReactNode
  /** Se informado, só esse perfil acessa (ex.: "dono"). */
  papel?: Papel
}

/** Sem login → manda para /entrar e depois volta. Perfil errado → acesso restrito. */
export default function RotaProtegida({ children, papel }: Props) {
  const { usuario, carregando } = useAuth()
  const { pathname, search } = useLocation()

  // Ainda conferindo a sessão: sem isso, quem está logado iria para /entrar ao recarregar.
  if (carregando) return <CarregandoPagina />

  if (!usuario) {
    return <Navigate to={`/entrar?voltar=${encodeURIComponent(pathname + search)}`} replace />
  }

  if (papel && usuario.papel !== papel) {
    return (
      <section className="secao">
        <div className="container pagina-estreita nao-encontrada">
          <span className="icone-destaque icone-destaque--grande" aria-hidden="true">
            <Lock size={28} />
          </span>
          <h1>Acesso restrito</h1>
          <p>Esta área é exclusiva da administração da barbearia.</p>
          <Link to="/" className="botao">
            Voltar para o início
          </Link>
        </div>
      </section>
    )
  }

  return children
}
