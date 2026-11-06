import { CalendarPlus, CalendarX, Clock, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CancelarAgendamento from '../components/CancelarAgendamento.tsx'
import { ErroCarregamento, Esqueleto } from '../components/agendamento/Estados.tsx'
import { useUsuarioLogado } from '../contexts/auth.ts'
import { useAvisos } from '../contexts/avisos.ts'
import { useRecurso } from '../hooks/useRecurso.ts'
import { useTitulo } from '../hooks/useTitulo.ts'
import {
  ANTECEDENCIA_CANCELAMENTO_MIN,
  cancelarAgendamento,
  inicioAgendamento,
  listarBarbeiros,
  listarMeusAgendamentos,
  podeCancelar,
} from '../services/agendamentoApi.ts'
import type { Agendamento } from '../types/agendamento.ts'
import {
  deIso,
  formatarDiaSemanaCurto,
  formatarDuracao,
  formatarMesCurto,
  horaParaMinutos,
  minutosParaHora,
} from '../utils/datas.ts'

const fim = (a: Agendamento) => minutosParaHora(horaParaMinutos(a.hora) + a.duracaoMin)

export default function MeusAgendamentos() {
  useTitulo('Meus agendamentos')
  const usuario = useUsuarioLogado()
  const avisar = useAvisos()
  // Capturado uma vez ao abrir a tela (não a cada renderização).
  const [agora] = useState(() => Date.now())
  const lista = useRecurso(`meus|${usuario.id}`, listarMeusAgendamentos)
  const barbeiros = useRecurso('barbeiros', listarBarbeiros)
  const nomeBarbeiro = (id: string) => barbeiros.dados?.find((b) => b.id === id)?.nome ?? '—'

  const proximos = (lista.dados ?? [])
    .filter((a) => a.status === 'confirmado' && inicioAgendamento(a).getTime() >= agora)
    .sort((a, b) => inicioAgendamento(a).getTime() - inicioAgendamento(b).getTime())
  const anteriores = (lista.dados ?? [])
    .filter((a) => !proximos.includes(a))
    .sort((a, b) => inicioAgendamento(b).getTime() - inicioAgendamento(a).getTime())

  function cartao(a: Agendamento, futuro: boolean) {
    const dia = deIso(a.data)
    const cancelado = a.status === 'cancelado'
    return (
      <li key={a.id} className={`agendamento${cancelado ? ' agendamento--cancelado' : ''}`}>
        <div className="agendamento-data" aria-hidden="true">
          <span>{formatarDiaSemanaCurto(dia)}</span>
          <strong>{dia.getDate()}</strong>
          <span>{formatarMesCurto(dia)}</span>
        </div>
        <div className="agendamento-corpo">
          <div className="agendamento-topo">
            <h3>{a.servicoNome}</h3>
            {cancelado && <span className="selo selo--cancelado">Cancelado</span>}
            {!cancelado && !futuro && <span className="selo">Concluído</span>}
          </div>
          <p className="agendamento-info">
            <span>
              <Clock size={15} aria-hidden="true" /> {a.hora} – {fim(a)} ·{' '}
              {formatarDuracao(a.duracaoMin)}
            </span>
            <span>
              <UserRound size={15} aria-hidden="true" /> {nomeBarbeiro(a.barbeiroId)}
            </span>
          </p>
          <span className="visualmente-oculto">
            {dia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          {futuro &&
            (podeCancelar(a) ? (
              <CancelarAgendamento
                onConfirmar={async () => {
                  await cancelarAgendamento(a.id)
                  avisar('Agendamento cancelado. O horário foi liberado.')
                  lista.recarregar()
                }}
              />
            ) : (
              <p className="agendamento-aviso">
                Cancelamento disponível só até {ANTECEDENCIA_CANCELAMENTO_MIN / 60}h antes. Para
                desmarcar, fale com a barbearia.
              </p>
            ))}
        </div>
      </li>
    )
  }

  return (
    <section className="secao secao--compacta">
      <div className="container pagina-media">
        <header className="cabecalho-pagina">
          <div>
            <span className="etiqueta">Minha conta</span>
            <h1>Meus agendamentos</h1>
            <p>Olá, {usuario.nome.split(' ')[0]}! Aqui estão seus horários.</p>
          </div>
          <Link to="/agendar" className="botao">
            <CalendarPlus size={18} aria-hidden="true" /> Novo agendamento
          </Link>
        </header>

        {lista.erro && (
          <ErroCarregamento mensagem={lista.erro} onTentarNovamente={lista.recarregar} />
        )}
        {lista.carregando && <Esqueleto quantidade={2} className="lista-agendamentos" />}

        {lista.dados && (
          <>
            <h2 className="titulo-grupo">Próximos</h2>
            {proximos.length === 0 ? (
              <div className="vazio">
                <CalendarX size={28} aria-hidden="true" />
                <p>Você não tem horários marcados.</p>
                <Link to="/agendar" className="link-seta">
                  Agendar agora
                </Link>
              </div>
            ) : (
              <ul className="lista-agendamentos">{proximos.map((a) => cartao(a, true))}</ul>
            )}

            {anteriores.length > 0 && (
              <>
                <h2 className="titulo-grupo">Histórico</h2>
                <ul className="lista-agendamentos">{anteriores.map((a) => cartao(a, false))}</ul>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
