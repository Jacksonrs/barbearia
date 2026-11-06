import { AlertCircle, Loader2, Mail, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/auth.ts'
import { useAvisos } from '../contexts/avisos.ts'
import type { TipoLogin, Usuario } from '../types/usuario.ts'
import { formatarTelefone } from '../utils/cliente.ts'
import BotaoGoogle from './BotaoGoogle.tsx'
import Campo from './Campo.tsx'
import InputSenha from './InputSenha.tsx'

const opcoes: { tipo: TipoLogin; rotulo: string; icone: typeof Mail }[] = [
  { tipo: 'email', rotulo: 'E-mail', icone: Mail },
  { tipo: 'telefone', rotulo: 'Telefone', icone: Phone },
]

type Props = {
  /** Prefixo dos ids dos campos (para não repetir ids se houver mais de um formulário). */
  prefixo?: string
}

/**
 * Login com Google ou com e-mail/telefone + senha. Usado na tela "Entrar" e no quadro
 * da página inicial. Depois de entrar, a própria página leva para a área da conta.
 */
export default function FormLogin({ prefixo = 'login' }: Props) {
  const { entrar, entrarComGoogle } = useAuth()
  const avisar = useAvisos()

  const [tipo, setTipo] = useState<TipoLogin>('email')
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ identificador?: string; senha?: string }>({})
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'senha' | 'google' | null>(null)

  const idIdentificador = `${prefixo}-identificador`
  const idSenha = `${prefixo}-senha`

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
      document.getElementById(novosErros.identificador ? idIdentificador : idSenha)?.focus()
      return
    }
    void executar('senha', () => entrar({ tipo, identificador, senha }))
  }

  return (
    <>
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
                name={`${prefixo}-tipo`}
                className="visualmente-oculto"
                checked={tipo === opcao}
                onChange={() => trocarTipo(opcao)}
              />
              <Icone size={16} aria-hidden="true" />
              {rotulo}
            </label>
          ))}
        </fieldset>

        <Campo id={idIdentificador} rotulo={tipo === 'email' ? 'E-mail' : 'Telefone'} erro={erros.identificador}>
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

        <Campo id={idSenha} rotulo="Senha" erro={erros.senha}>
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
    </>
  )
}
