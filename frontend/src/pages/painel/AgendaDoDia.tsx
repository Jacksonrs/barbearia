import {
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  RefreshCw,
  StoreIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import CancelarAgendamento from '../../components/CancelarAgendamento.tsx'
import { ErroCarregamento, Esqueleto } from '../../components/agendamento/Estados.tsx'
import { useAvisos } from '../../contexts/avisos.ts'
import { useRecurso } from '../../hooks/useRecurso.ts'
import { useTitulo } from '../../hooks/useTitulo.ts'
import {
  cancelarAgendamento,
  diaAberto,
  inicioAgendamento,
  listarBarbeiros,
  obterFuncionamento,
} from '../../services/agendamentoApi.ts'
import { agendaDoDia } from '../../services/painelApi.ts'
import { deIso, formatarDataLonga, horaParaMinutos, minutosParaHora, paraIso } from '../../utils/datas.ts'

const TODOS = 'todos'

function somarDias(iso: string, dias: number): string {
  const d = deIso(iso)
  d.setDate(d.getDate() + dias)
  return paraIso(d)
}

const apenasDigitos = (telefone: string) => telefone.replace(/\D/g, '')

export default function AgendaDoDia() {
  useTitulo('Agenda do dia')
  const avisar = useAvisos()
  // Atualizado a cada minuto: o "próximo cliente" e o botão de cancelar acompanham o relógio.
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(relogio)
  }, [])
  const hoje = paraIso(new Date(agora))
  const [data, setData] = useState(hoje)
  const [barbeiro, setBarbeiro] = useState(TODOS)

  const agenda = useRecurso(`agenda|${data}`, () => agendaDoDia(data))
  const barbeiros = useRecurso('barbeiros', listarBarbeiros)
  const funcionamento = useRecurso('funcionamento', obterFuncionamento)
  const nomeBarbeiro = (id: string) => barbeiros.dados?.find((b) => b.id === id)?.nome ?? '—'

  const doBarbeiro = (agenda.dados ?? []).filter((a) => barbeiro === TODOS || a.barbeiroId === barbeiro)
  const confirmados = doBarbeiro.filter((a) => a.status === 'confirmado')
  const cancelados = doBarbeiro.length - confirmados.length
  // Enquanto o horário de funcionamento não chega, trata o dia como aberto.
  const aberto = funcionamento.dados ? diaAberto(deIso(data), funcionamento.dados) : true
  // Hoje: destaca o próximo cliente a ser atendido.
  const proximoId =
    data === hoje ? confirmados.find((a) => inicioAgendamento(a).getTime() > agora)?.id : undefined

  return (
    <div className="agenda">
      <div className="agenda-barra">
        <div className="seletor-data">
          <button
            type="button"
            className="botao-icone"
            onClick={() => setData((d) => somarDias(d, -1))}
            aria-label="Dia anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <label className="seletor-data-campo">
            <span className="visualmente-oculto">Data</span>
            <input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} />
          </label>
          <button
            type="button"
            className="botao-icone"
            onClick={() => setData((d) => somarDias(d, 1))}
            aria-label="Próximo dia"
          >
            <ChevronRight size={20} />
          </button>
          {data !== hoje && (
            <button
              type="button"
              className="botao botao--secundario botao--pequeno"
              onClick={() => setData(hoje)}
            >
              <CalendarCheck size={16} aria-hidden="true" /> Voltar para hoje
            </button>
          )}
        </div>

        <div className="agenda-barra-acoes">
          <button
            type="button"
            className="botao-icone"
            onClick={agenda.recarregar}
            disabled={agenda.carregando || agenda.atualizando}
            aria-label="Atualizar agenda"
            title="Atualizar agenda"
          >
            <RefreshCw size={18} className={agenda.atualizando ? 'girando' : undefined} aria-hidden="true" />
          </button>

          <label className="filtro">
            <span>Barbeiro</span>
            <select value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)}>
              <option value={TODOS}>Todos</option>
              {barbeiros.dados?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="agenda-resumo">
        <div className="agenda-dia">
          {data === hoje && <span className="selo selo--ativo">Hoje</span>}
          <h2>{formatarDataLonga(data)}</h2>
        </div>
        {agenda.dados && aberto && (
          <p>
            <strong>{confirmados.length}</strong>{' '}
            {confirmados.length === 1 ? 'agendamento' : 'agendamentos'}
            {cancelados > 0 && ` · ${cancelados} ${cancelados === 1 ? 'cancelado' : 'cancelados'}`}
          </p>
        )}
      </div>

      {agenda.carregando && <Esqueleto quantidade={4} className="lista-agenda" />}
      {agenda.erro && <ErroCarregamento mensagem={agenda.erro} onTentarNovamente={agenda.recarregar} />}

      {agenda.dados && !aberto && doBarbeiro.length === 0 && (
        <div className="vazio">
          <StoreIcon size={28} aria-hidden="true" />
          <p>A barbearia não abre neste dia.</p>
        </div>
      )}

      {agenda.dados && aberto && doBarbeiro.length === 0 && (
        <div className="vazio">
          <CalendarX size={28} aria-hidden="true" />
          <p>Nenhum agendamento neste dia.</p>
        </div>
      )}

      {agenda.dados && doBarbeiro.length > 0 && (
        <ul className="lista-agenda">
          {doBarbeiro.map((a) => {
            const cancelado = a.status === 'cancelado'
            const futuro = inicioAgendamento(a).getTime() > agora
            const telefone = apenasDigitos(a.cliente.telefone)
            return (
              <li
                key={a.id}
                className={`item-agenda${cancelado ? ' item-agenda--cancelado' : ''}${a.id === proximoId ? ' item-agenda--proximo' : ''}`}
              >
                <div className="item-agenda-hora">
                  <strong>{a.hora}</strong>
                  <span>{minutosParaHora(horaParaMinutos(a.hora) + a.duracaoMin)}</span>
                </div>
                <div className="item-agenda-corpo">
                  <div className="agendamento-topo">
                    <h3>{a.cliente.nome}</h3>
                    {a.id === proximoId && <span className="selo selo--ativo">Próximo</span>}
                    {cancelado && (
                      <span className="selo selo--cancelado">
                        Cancelado{a.canceladoPor === 'cliente' ? ' pelo cliente' : ''}
                      </span>
                    )}
                  </div>
                  <p className="item-agenda-detalhes">
                    {a.servicoNome} · {nomeBarbeiro(a.barbeiroId)}
                  </p>
                  {a.cliente.observacao && (
                    <p className="item-agenda-obs">“{a.cliente.observacao}”</p>
                  )}
                </div>
                <div className="item-agenda-acoes">
                  {telefone && (
                    <div className="item-agenda-contato">
                      <a href={`tel:+55${telefone}`}>
                        <Phone size={15} aria-hidden="true" /> {a.cliente.telefone}
                      </a>
                      <a href={`https://wa.me/55${telefone}`} target="_blank" rel="noreferrer">
                        <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                      </a>
                    </div>
                  )}
                  {!cancelado && futuro && (
                    <CancelarAgendamento
                      onConfirmar={async () => {
                        await cancelarAgendamento(a.id)
                        avisar(`Horário das ${a.hora} de ${a.cliente.nome.split(' ')[0]} cancelado.`)
                        agenda.recarregar()
                      }}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
