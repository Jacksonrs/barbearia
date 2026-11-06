import { AlertCircle, Loader2, Mail, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import BotaoGoogle from '../components/BotaoGoogle.tsx'
import Campo from '../components/Campo.tsx'
import CarregandoPagina from '../components/CarregandoPagina.tsx'
import InputSenha from '../components/InputSenha.tsx'
import { destinoAposEntrar, useAuth } from '../contexts/auth.ts'
import { useAvisos } from '../contexts/avisos.ts'
import { useTitulo } from '../hooks/useTitulo.ts'
import type { TipoLogin, Usuario } from '../types/usuario.ts'
import { formatarTelefone } from '../utils/cliente.ts'

/** Conta do dono criada pelo seed do backend (só aparece em desenvolvimento). */
const CONTA_DEMO = { email: 'dono@jrbarber.com', senha: 'jrbarber123' }

const opcoes: { tipo: TipoLogin; rotulo: string; icone: typeof Mail }[] = [
  { tipo: 'email', rotulo: 'E-mail', icone: Mail },
  { tipo: 'telefone', rotulo: 'Telefone', icone: Phone },
]

export default function Entrar() {
  const { usuario, carregando, entrar, entrarComGoogle } = useAuth()
  useTitulo('Entrar')
  const avisar = useAvisos()
  const [parametros] = useSearchParams()
  const voltar = parametros.get('voltar')

  const [tipo, setTipo] = useState<TipoLogin>('email')
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ identificador?: string; senha?: string }>({})
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'senha' | 'google' | null>(null)

  if (carregando) return <CarregandoPagina />
  // Já entrou (ou acabou de entrar): segue para onde precisava ir.
  if (usuario) return <Navigate to={destinoAposEntrar(usuario, voltar)} replace />

  function trocarTipo(novo: TipoLogin) {
    setTipo(novo)
    setIdentificador('')
    setErros({})
    setErro(null)
  }

  async function executar(tipoEnvio: 'senha' | 'google', acao: () => Promise<Usuario>) {
    setErro(null)
    setEnviando(tipoEnvio)
    try {
      const u = await acao()
      avisar(`Olá, ${u.nome.split(' ')[0]}! Que bom te ver de novo.`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.')
      setEnviando(null)
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    const novosErros = {
      identificador: identificador.trim()
        ? undefined
        : tipo === 'email'
          ? 'Informe seu e-mail.'
          : 'Informe seu telefone.',
      senha: senha ? undefined : 'Informe sua senha.',
    }
    setErros(novosErros)
    if (novosErros.identificador || novosErros.senha) {
      document.getElementById(novosErros.identificador ? 'login-identificador' : 'login-senha')?.focus()
      return
    }
    void executar('senha', () => entrar({ tipo, identificador, senha }))
  }

  const linkCadastro = voltar ? `/cadastro?voltar=${encodeURIComponent(voltar)}` : '/cadastro'

  return (
    <section className="secao secao--compacta">
      <div className="container">
        <div className="cartao-auth">
          <header className="cartao-auth-cabecalho">
            <h1>Entrar</h1>
            <p>Acesse para agendar e acompanhar seus horários.</p>
          </header>

          <BotaoGoogle
            onClick={() => void executar('google', entrarComGoogle)}
            carregando={enviando === 'google'}
            desativado={enviando !== null}
          />

          <div className="divisor">
            <span>ou entre com</span>
          </div>

          <form onSubmit={aoEnviar} noValidate className="form-auth">
            <fieldset className="segmentado">
              <legend className="visualmente-oculto">Entrar com</legend>
              {opcoes.map(({ tipo: opcao, rotulo, icone: Icone }) => (
                <label key={opcao} className="segmentado-opcao">
                  <input
                    type="radio"
                    name="tipo-login"
                    className="visualmente-oculto"
                    checked={tipo === opcao}
                    onChange={() => trocarTipo(opcao)}
                  />
                  <Icone size={16} aria-hidden="true" />
                  {rotulo}
                </label>
              ))}
            </fieldset>

            <Campo
              id="login-identificador"
              rotulo={tipo === 'email' ? 'E-mail' : 'Telefone'}
              erro={erros.identificador}
            >
              {(props) =>
                tipo === 'email' ? (
                  <input
                    {...props}
                    type="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                  />
                ) : (
                  <input
                    {...props}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(00) 00000-0000"
                    value={identificador}
                    onChange={(e) => setIdentificador(formatarTelefone(e.target.value))}
                  />
                )
              }
            </Campo>

            <Campo id="login-senha" rotulo="Senha" erro={erros.senha}>
              {(props) => (
                <InputSenha
                  {...props}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              )}
            </Campo>

            {erro && (
              <div className="alerta alerta--erro" role="alert">
                <AlertCircle size={20} aria-hidden="true" />
                <p>{erro}</p>
              </div>
            )}

            <button type="submit" className="botao botao--bloco" disabled={enviando !== null}>
              {enviando === 'senha' ? (
                <>
                  <Loader2 size={18} className="girando" aria-hidden="true" /> Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

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
