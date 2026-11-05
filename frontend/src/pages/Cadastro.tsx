import { AlertCircle, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import BotaoGoogle from '../components/BotaoGoogle.tsx'
import Campo from '../components/Campo.tsx'
import InputSenha from '../components/InputSenha.tsx'
import { destinoAposEntrar, useAuth } from '../contexts/auth.ts'
import type { DadosCadastro } from '../types/usuario.ts'
import { formatarTelefone, SENHA_MINIMA, validarCadastro } from '../utils/cliente.ts'

export default function Cadastro() {
  const { usuario, cadastrar, entrarComGoogle } = useAuth()
  const [parametros] = useSearchParams()
  const voltar = parametros.get('voltar')

  const [dados, setDados] = useState<DadosCadastro>({ nome: '', telefone: '', email: '', senha: '' })
  const [mostrarErros, setMostrarErros] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'senha' | 'google' | null>(null)

  if (usuario) return <Navigate to={destinoAposEntrar(usuario, voltar)} replace />

  const erros = validarCadastro(dados)
  const erroVisivel = (campo: keyof DadosCadastro) => (mostrarErros ? erros[campo] : undefined)
  const alterar = (campo: keyof DadosCadastro, valor: string) => setDados((d) => ({ ...d, [campo]: valor }))

  async function executar(tipo: 'senha' | 'google', acao: () => Promise<unknown>) {
    setErro(null)
    setEnviando(tipo)
    try {
      await acao()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a conta. Tente novamente.')
      setEnviando(null)
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    const primeiroErro = Object.keys(erros)[0]
    if (primeiroErro) {
      setMostrarErros(true)
      document.getElementById(`cadastro-${primeiroErro}`)?.focus()
      return
    }
    void executar('senha', () => cadastrar(dados))
  }

  const linkEntrar = voltar ? `/entrar?voltar=${encodeURIComponent(voltar)}` : '/entrar'

  return (
    <section className="secao secao--compacta">
      <div className="container">
        <div className="cartao-auth">
          <header className="cartao-auth-cabecalho">
            <h1>Criar conta</h1>
            <p>Leva menos de um minuto. Depois é só agendar.</p>
          </header>

          <BotaoGoogle
            onClick={() => void executar('google', entrarComGoogle)}
            carregando={enviando === 'google'}
            desativado={enviando !== null}
          />

          <div className="divisor">
            <span>ou cadastre-se com seus dados</span>
          </div>

          <form onSubmit={aoEnviar} noValidate className="form-auth">
            <Campo id="cadastro-nome" rotulo="Nome completo" erro={erroVisivel('nome')}>
              {(props) => (
                <input
                  {...props}
                  type="text"
                  autoComplete="name"
                  value={dados.nome}
                  onChange={(e) => alterar('nome', e.target.value)}
                />
              )}
            </Campo>

            <Campo
              id="cadastro-telefone"
              rotulo="Telefone / WhatsApp"
              erro={erroVisivel('telefone')}
              dica="Você pode usar o telefone para entrar."
            >
              {(props) => (
                <input
                  {...props}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="(00) 00000-0000"
                  value={dados.telefone}
                  onChange={(e) => alterar('telefone', formatarTelefone(e.target.value))}
                />
              )}
            </Campo>

            <Campo
              id="cadastro-email"
              rotulo="E-mail"
              opcional
              erro={erroVisivel('email')}
              dica="Informe se quiser entrar também pelo e-mail."
            >
              {(props) => (
                <input
                  {...props}
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={dados.email}
                  onChange={(e) => alterar('email', e.target.value)}
                />
              )}
            </Campo>

            <Campo
              id="cadastro-senha"
              rotulo="Senha"
              erro={erroVisivel('senha')}
              dica={`Mínimo de ${SENHA_MINIMA} caracteres.`}
            >
              {(props) => (
                <InputSenha
                  {...props}
                  autoComplete="new-password"
                  value={dados.senha}
                  onChange={(e) => alterar('senha', e.target.value)}
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
                  <Loader2 size={18} className="girando" aria-hidden="true" /> Criando conta…
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="cartao-auth-rodape">
            Já tem conta? <Link to={linkEntrar}>Entrar</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
