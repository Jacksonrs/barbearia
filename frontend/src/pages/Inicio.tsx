import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Crown,
  Scissors,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

type Servico = { nome: string; descricao: string; icone: LucideIcon }

const servicos: Servico[] = [
  {
    nome: 'Corte',
    descricao: 'Na tesoura ou na máquina, do clássico ao degradê, com acabamento na navalha.',
    icone: Scissors,
  },
  {
    nome: 'Barba',
    descricao: 'Toalha quente, navalha e hidratação para uma barba alinhada e confortável.',
    icone: Sparkles,
  },
  {
    nome: 'Corte + Barba',
    descricao: 'O serviço completo para sair pronto, em um único horário.',
    icone: Crown,
  },
]

const passos = [
  { titulo: 'Escolha o serviço', descricao: 'Corte, barba ou o combo completo.', icone: Scissors },
  { titulo: 'Escolha o barbeiro', descricao: 'Agende com o profissional de sua preferência.', icone: UserRound },
  { titulo: 'Escolha o horário', descricao: 'Veja os horários livres e confirme na hora.', icone: Clock },
]

export default function Inicio() {
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

          <ul className="grade-servicos">
            {servicos.map(({ nome, descricao, icone: Icone }) => (
              <li key={nome} className="cartao-servico">
                <span className="icone-destaque" aria-hidden="true">
                  <Icone size={22} />
                </span>
                <h3>{nome}</h3>
                <p>{descricao}</p>
                <Link to="/agendar" className="link-seta" aria-label={`Agendar ${nome}`}>
                  Agendar <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
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
