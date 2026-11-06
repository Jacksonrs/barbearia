import { ArrowRight, Clock, Scissors, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import CarregandoPagina from '../components/CarregandoPagina.tsx'
import FormLogin from '../components/FormLogin.tsx'
import LinkAgendar, { ID_QUADRO_LOGIN } from '../components/LinkAgendar.tsx'
import { ErroCarregamento, Esqueleto } from '../components/agendamento/Estados.tsx'
import { iconeDoServico } from '../components/agendamento/iconesServico.ts'
import { destinoAposEntrar, useAuth } from '../contexts/auth.ts'
import { useRecurso } from '../hooks/useRecurso.ts'
import { useTitulo } from '../hooks/useTitulo.ts'
import { listarServicos } from '../services/agendamentoApi.ts'
import { formatarDuracao } from '../utils/datas.ts'

const passos = [
  { titulo: 'Escolha o serviço', descricao: 'Corte, barba ou o combo completo.', icone: Scissors },
  { titulo: 'Escolha o barbeiro', descricao: 'Agende com o profissional de sua preferência.', icone: UserRound },
  { titulo: 'Escolha o horário', descricao: 'Veja os horários livres e confirme na hora.', icone: Clock },
]

export default function Inicio() {
  useTitulo()
  const { usuario, carregando } = useAuth()
  const { state, hash, key } = useLocation()
  const saindo = (state as { saindo?: boolean } | null)?.saindo === true
  // Veio de um "Agendar": depois do login, segue para lá (ex.: /agendar?servico=corte).
  const [parametros] = useSearchParams()
  const voltar = parametros.get('voltar')
  // Vem da mesma fonte do agendamento: o que o dono altera no painel aparece aqui.
  const servicos = useRecurso('servicos', listarServicos)

  // Clicou em "Agendar" sem estar logado: o Layout rola até o quadro; aqui o cursor vai
  // para o primeiro campo e o quadro dá um brilho para chamar a atenção.
  useEffect(() => {
    if (hash !== `#${ID_QUADRO_LOGIN}`) return
    const quadro = document.getElementById(ID_QUADRO_LOGIN)
    if (!quadro) return
    document.getElementById('hero-login-identificador')?.focus({ preventScroll: true })
    quadro.classList.remove('hero-login--destaque')
    void quadro.offsetWidth // Reinicia a animação a cada clique.
    quadro.classList.add('hero-login--destaque')
  }, [hash, key, carregando])

  // A página inicial é a vitrine para visitantes: quem está logado fica na sua área
  // (cliente nos agendamentos, dono no painel). Ao sair da conta, volta para cá.
  if (carregando) return <CarregandoPagina />
  if (usuario && !saindo) return <Navigate to={destinoAposEntrar(usuario, voltar)} replace />

  return (
    <>
      <section className="hero">
        <div className="container hero-interno">
          <div className="hero-texto">
            <span className="etiqueta">Barbearia · Agendamento online</span>
            <h1>
              Estilo e precisão <em>em cada corte.</em>
            </h1>
            <p className="hero-descricao">
              Marque seu horário em poucos cliques e chegue na hora certa. Sem fila, sem espera.
            </p>
            <div className="hero-acoes">
              <LinkAgendar className="botao">
                Agendar horário <ArrowRight size={18} aria-hidden="true" />
              </LinkAgendar>
              <Link to="/#servicos" className="botao botao--secundario">
                Ver serviços
              </Link>
            </div>
          </div>

          {/* Login direto na vitrine (só visitantes veem esta página). No celular fica
              escondido para não empurrar o "Agendar horário"; lá o login é pelo menu. */}
          <div className="hero-visual">
            <section
              id={ID_QUADRO_LOGIN}
              className="hero-cartao hero-login"
              aria-labelledby="hero-login-titulo"
            >
              <header className="hero-login-cabecalho">
                <span className="hero-monograma" aria-hidden="true">
                  JR
                </span>
                <div>
                  <h2 id="hero-login-titulo">Acesse sua conta</h2>
                  <p>Agende e acompanhe seus horários.</p>
                </div>
              </header>

              <FormLogin prefixo="hero-login" />

              <p className="cartao-auth-rodape">
                Não tem conta?{' '}
                <Link to={voltar ? `/cadastro?voltar=${encodeURIComponent(voltar)}` : '/cadastro'}>
                  Criar conta
                </Link>
              </p>
            </section>
          </div>
        </div>
      </section>

      <section id="servicos" className="secao">
        <div className="container">
          <header className="secao-cabecalho">
            <span className="etiqueta">Serviços</span>
            <h2>O que fazemos por você</h2>
          </header>

          {servicos.carregando && <Esqueleto quantidade={3} className="grade-servicos" />}
          {servicos.erro && (
            <ErroCarregamento mensagem={servicos.erro} onTentarNovamente={servicos.recarregar} />
          )}
          {servicos.dados && (
            <ul className="grade-servicos">
              {servicos.dados.map(({ id, nome, descricao, duracaoMin }) => {
                const Icone = iconeDoServico(id)
                return (
                  <li key={id} className="cartao-servico">
                    <span className="icone-destaque" aria-hidden="true">
                      <Icone size={22} />
                    </span>
                    <h3>{nome}</h3>
                    <p>{descricao}</p>
                    <span className="opcao-meta">
                      <Clock size={14} aria-hidden="true" /> {formatarDuracao(duracaoMin)}
                    </span>
                    <LinkAgendar
                      para={`/agendar?servico=${encodeURIComponent(id)}`}
                      className="link-seta"
                      aria-label={`Agendar ${nome}`}
                    >
                      Agendar <ArrowRight size={16} aria-hidden="true" />
                    </LinkAgendar>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section id="como-funciona" className="secao secao--alternada">
        <div className="container">
          <header className="secao-cabecalho">
            <span className="etiqueta">Como funciona</span>
            <h2>Seu horário em três passos</h2>
          </header>

          <ol className="passos">
            {passos.map(({ titulo, descricao, icone: Icone }, indice) => (
              <li key={titulo} className="passo">
                <span className="passo-numero">{String(indice + 1).padStart(2, '0')}</span>
                <Icone size={22} className="passo-icone" aria-hidden="true" />
                <h3>{titulo}</h3>
                <p>{descricao}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="secao">
        <div className="container">
          <div className="chamada">
            <div>
              <h2>Pronto para o próximo corte?</h2>
              <p>Escolha o melhor horário para você e garanta sua vaga.</p>
            </div>
            <LinkAgendar className="botao">
              Agendar agora <ArrowRight size={18} aria-hidden="true" />
            </LinkAgendar>
          </div>
        </div>
      </section>
    </>
  )
}
