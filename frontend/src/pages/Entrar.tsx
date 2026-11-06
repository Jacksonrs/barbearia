import { Link, Navigate, useSearchParams } from 'react-router-dom'
import CarregandoPagina from '../components/CarregandoPagina.tsx'
import FormLogin from '../components/FormLogin.tsx'
import { destinoAposEntrar, useAuth } from '../contexts/auth.ts'
import { useTitulo } from '../hooks/useTitulo.ts'

/** Conta do dono criada pelo seed do backend (só aparece em desenvolvimento). */
const CONTA_DEMO = { email: 'dono@jrbarber.com', senha: 'jrbarber123' }

export default function Entrar() {
  useTitulo('Entrar')
  const { usuario, carregando } = useAuth()
  const [parametros] = useSearchParams()
  const voltar = parametros.get('voltar')

  if (carregando) return <CarregandoPagina />
  // Já entrou (ou acabou de entrar): segue para onde precisava ir.
  if (usuario) return <Navigate to={destinoAposEntrar(usuario, voltar)} replace />

  const linkCadastro = voltar ? `/cadastro?voltar=${encodeURIComponent(voltar)}` : '/cadastro'

  return (
    <section className="secao secao--compacta">
      <div className="container">
        <div className="cartao-auth">
          <header className="cartao-auth-cabecalho">
            <h1>Entrar</h1>
            <p>Acesse para agendar e acompanhar seus horários.</p>
          </header>

          <FormLogin />

          <p className="cartao-auth-rodape">
            Ainda não tem conta? <Link to={linkCadastro}>Criar conta</Link>
          </p>

          {import.meta.env.DEV && (
            <p className="nota-demo">
              <strong>Demonstração:</strong> acesso do dono com{' '}
              <code>{CONTA_DEMO.email}</code> e senha <code>{CONTA_DEMO.senha}</code>.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
