import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth.ts'

/** id do quadro de login da página inicial (destino da rolagem). */
export const ID_QUADRO_LOGIN = 'acesse'

/** O quadro existe e está visível? (No celular ele fica escondido pelo CSS.) */
function quadroLoginVisivel(): boolean {
  const quadro = document.getElementById(ID_QUADRO_LOGIN)
  return Boolean(quadro && quadro.getClientRects().length > 0)
}

type Props = {
  /** Para onde ir depois de entrar (padrão: o agendamento). */
  para?: string
  className?: string
  'aria-label'?: string
  onClick?: () => void
  children: ReactNode
}

/**
 * Link "Agendar". Para visitante na página inicial, em vez de abrir o agendamento (que
 * mandaria para a tela "Entrar"), desce até o quadro de login; depois de entrar, segue
 * para `para`. Logado, ou com o quadro escondido (celular), é um link comum.
 */
export default function LinkAgendar({ para = '/agendar', onClick, children, ...resto }: Props) {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const navegar = useNavigate()

  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    onClick?.()
    if (usuario || pathname !== '/' || !quadroLoginVisivel()) return
    evento.preventDefault()
    // O #acesse faz o Layout rolar até o quadro; o `voltar` diz para onde ir após o login.
    navegar(`/?voltar=${encodeURIComponent(para)}#${ID_QUADRO_LOGIN}`, { replace: true })
  }

  return (
    <Link to={para} onClick={aoClicar} {...resto}>
      {children}
    </Link>
  )
}
