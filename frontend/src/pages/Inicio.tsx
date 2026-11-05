import { ArrowRight, CalendarCheck, Clock, Scissors, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErroCarregamento, Esqueleto } from '../components/agendamento/Estados.tsx'
import { iconeDoServico } from '../components/agendamento/iconesServico.ts'
import { useRecurso } from '../hooks/useRecurso.ts'
import { listarServicos } from '../services/agendamentoApi.ts'
import { formatarDuracao } from '../utils/datas.ts'

const passos = [
  { titulo: 'Escolha o serviço', descricao: 'Corte, barba ou o combo completo.', icone: Scissors },
  { titulo: 'Escolha o barbeiro', descricao: 'Agende com o profissional de sua preferência.', icone: UserRound },
  { titulo: 'Escolha o horário', descricao: 'Veja os horários livres e confirme na hora.', icone: Clock },
]

export default function Inicio() {
  // Vem da mesma fonte do agendamento: o que o dono altera no painel aparece aqui.
  const servicos = useRecurso('servicos', listarServicos)

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
              <Link to="/agendar" className="botao">
                Agendar horário <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/#servicos" className="botao botao--secundario">
                Ver serviços
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-cartao">
              <span className="hero-monograma">JR</span>
              <ul className="hero-lista">
                <li>
                  <CalendarCheck size={18} /> Agendamento online
                </li>
                <li>
                  <UserRound size={18} /> Escolha seu barbeiro
                </li>
                <li>
                  <Clock size={18} /> Sem fila de espera
                </li>
              </ul>
            </div>
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
                    <Link to="/agendar" className="link-seta" aria-label={`Agendar ${nome}`}>
                      Agendar <ArrowRight size={16} aria-hidden="true" />
                    </Link>
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
            <Link to="/agendar" className="botao">
              Agendar agora <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
