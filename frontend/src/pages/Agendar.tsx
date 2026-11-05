import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import Confirmado from '../components/agendamento/Confirmado.tsx'
import EtapaBarbeiro from '../components/agendamento/EtapaBarbeiro.tsx'
import EtapaDados from '../components/agendamento/EtapaDados.tsx'
import EtapaHorario from '../components/agendamento/EtapaHorario.tsx'
import EtapaServico from '../components/agendamento/EtapaServico.tsx'
import Etapas from '../components/agendamento/Etapas.tsx'
import { ETAPAS } from '../components/agendamento/listaEtapas.ts'
import { ErroCarregamento, Esqueleto } from '../components/agendamento/Estados.tsx'
import Resumo from '../components/agendamento/Resumo.tsx'
import { itensResumo } from '../components/agendamento/itensResumo.ts'
import { useUsuarioLogado } from '../contexts/auth.ts'
import { useRecurso } from '../hooks/useRecurso.ts'
import { criarAgendamento, listarBarbeiros, listarServicos } from '../services/agendamentoApi.ts'
import { SEM_PREFERENCIA, type Agendamento, type DadosCliente } from '../types/agendamento.ts'
import type { Usuario } from '../types/usuario.ts'
import { validarCliente } from '../utils/cliente.ts'
import { formatarDataCurta, formatarDataLonga, formatarDuracao } from '../utils/datas.ts'

const ULTIMA_ETAPA = ETAPAS.length - 1

type Estado = {
  etapa: number
  servicoId: string | null
  barbeiroId: string | null
  data: string | null
  hora: string | null
  cliente: DadosCliente
}

type Acao =
  | { tipo: 'servico'; id: string }
  | { tipo: 'barbeiro'; id: string }
  | { tipo: 'data'; data: string }
  | { tipo: 'hora'; hora: string }
  | { tipo: 'cliente'; campo: keyof DadosCliente; valor: string }
  | { tipo: 'irPara'; etapa: number }
  | { tipo: 'trocarHorario' }
  | { tipo: 'reiniciar'; estado: Estado }

/** Começa com os dados de contato da conta já preenchidos. */
function criarEstadoInicial(usuario: Usuario): Estado {
  return {
    etapa: 0,
    servicoId: null,
    barbeiroId: null,
    data: null,
    hora: null,
    cliente: {
      nome: usuario.nome,
      telefone: usuario.telefone,
      email: usuario.email,
      observacao: '',
    },
  }
}

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    // Trocar serviço, barbeiro ou dia muda a disponibilidade: o horário precisa ser escolhido de novo.
    case 'servico':
      return { ...estado, servicoId: acao.id, hora: null }
    case 'barbeiro':
      return { ...estado, barbeiroId: acao.id, hora: null }
    case 'data':
      return { ...estado, data: acao.data, hora: null }
    case 'hora':
      return { ...estado, hora: acao.hora }
    case 'cliente':
      return { ...estado, cliente: { ...estado.cliente, [acao.campo]: acao.valor } }
    case 'irPara':
      return { ...estado, etapa: acao.etapa }
    case 'trocarHorario':
      return { ...estado, etapa: 2, hora: null }
    case 'reiniciar':
      return acao.estado
  }
}

function etapaCompleta(estado: Estado, etapa: number): boolean {
  switch (etapa) {
    case 0:
      return estado.servicoId !== null
    case 1:
      return estado.barbeiroId !== null
    case 2:
      return estado.data !== null && estado.hora !== null
    default:
      return Object.keys(validarCliente(estado.cliente)).length === 0
  }
}

const AVISO_ETAPA = [
  'Selecione um serviço para continuar.',
  'Selecione um barbeiro para continuar.',
  'Selecione o dia e o horário para continuar.',
]

type Envio =
  | { status: 'parado' }
  | { status: 'enviando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'confirmado'; agendamento: Agendamento }

export default function Agendar() {
  const usuario = useUsuarioLogado()
  const [estado, despachar] = useReducer(reducer, usuario, criarEstadoInicial)
  const [envio, setEnvio] = useState<Envio>({ status: 'parado' })
  const [mostrarErros, setMostrarErros] = useState(false)

  const servicos = useRecurso('servicos', listarServicos)
  const barbeiros = useRecurso('barbeiros', listarBarbeiros)

  // A cada troca de etapa: foco no título (teclado e leitores de tela) e, se o usuário
  // tinha rolado para baixo (comum no celular), volta a mostrar o topo do painel.
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const etapasRef = useRef<HTMLDivElement>(null)
  const primeiraRenderizacao = useRef(true)
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    tituloRef.current?.focus({ preventScroll: true })
    const topo = etapasRef.current
    if (topo && topo.getBoundingClientRect().top < 0) {
      topo.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [estado.etapa])

  const servico = servicos.dados?.find((s) => s.id === estado.servicoId)
  const nomeBarbeiro = (id: string | null) =>
    id === SEM_PREFERENCIA
      ? 'Sem preferência'
      : (barbeiros.dados?.find((b) => b.id === id)?.nome ?? null)

  const itens = (barbeiroId: string | null) =>
    itensResumo({
      servico: servico ? `${servico.nome} · ${formatarDuracao(servico.duracaoMin)}` : null,
      barbeiro: nomeBarbeiro(barbeiroId),
      data: estado.data ? formatarDataLonga(estado.data) : null,
      hora: estado.hora,
    })

  const resumoCompacto = [
    servico?.nome,
    estado.data && formatarDataCurta(estado.data),
    estado.hora,
  ]
    .filter(Boolean)
    .join(' · ')

  const errosCliente = validarCliente(estado.cliente)
  const podeAvancar = etapaCompleta(estado, estado.etapa)
  const enviando = envio.status === 'enviando'

  function irPara(etapa: number) {
    setEnvio({ status: 'parado' })
    despachar({ tipo: 'irPara', etapa })
  }

  async function confirmar() {
    const { servicoId, barbeiroId, data, hora, cliente } = estado
    if (!servicoId || !barbeiroId || !data || !hora) return

    setEnvio({ status: 'enviando' })
    try {
      const agendamento = await criarAgendamento({ servicoId, barbeiroId, data, hora, cliente })
      setEnvio({ status: 'confirmado', agendamento })
    } catch (erro) {
      setEnvio({
        status: 'erro',
        mensagem: erro instanceof Error ? erro.message : 'Não foi possível agendar. Tente novamente.',
      })
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return

    if (estado.etapa < ULTIMA_ETAPA) {
      if (podeAvancar) irPara(estado.etapa + 1)
      return
    }

    const primeiroErro = Object.keys(errosCliente)[0]
    if (primeiroErro) {
      setMostrarErros(true)
      document.getElementById(`cliente-${primeiroErro}`)?.focus()
      return
    }
    void confirmar()
  }

  function reiniciar() {
    setEnvio({ status: 'parado' })
    setMostrarErros(false)
    despachar({ tipo: 'reiniciar', estado: criarEstadoInicial(usuario) })
  }

  function conteudoEtapa() {
    switch (estado.etapa) {
      case 0:
        if (servicos.erro)
          return <ErroCarregamento mensagem={servicos.erro} onTentarNovamente={servicos.recarregar} />
        if (!servicos.dados) return <Esqueleto quantidade={3} className="opcoes" />
        return (
          <EtapaServico
            servicos={servicos.dados}
            selecionado={estado.servicoId}
            onSelecionar={(id) => despachar({ tipo: 'servico', id })}
          />
        )
      case 1:
        if (barbeiros.erro)
          return <ErroCarregamento mensagem={barbeiros.erro} onTentarNovamente={barbeiros.recarregar} />
        if (!barbeiros.dados) return <Esqueleto quantidade={4} className="opcoes opcoes--grade" />
        return (
          <EtapaBarbeiro
            barbeiros={barbeiros.dados}
            selecionado={estado.barbeiroId}
            onSelecionar={(id) => despachar({ tipo: 'barbeiro', id })}
          />
        )
      case 2:
        return (
          <EtapaHorario
            servicoId={estado.servicoId ?? ''}
            barbeiroId={estado.barbeiroId ?? SEM_PREFERENCIA}
            data={estado.data}
            hora={estado.hora}
            onData={(data) => despachar({ tipo: 'data', data })}
            onHora={(hora) => despachar({ tipo: 'hora', hora })}
          />
        )
      default:
        return (
          <EtapaDados
            cliente={estado.cliente}
            erros={errosCliente}
            mostrarTodosErros={mostrarErros}
            onAlterar={(campo, valor) => despachar({ tipo: 'cliente', campo, valor })}
          />
        )
    }
  }

  const etapaAtual = ETAPAS[estado.etapa]

  return (
    <section className="secao secao--compacta">
      <div className="container">
        <header className="secao-cabecalho secao-cabecalho--esquerda">
          <span className="etiqueta">Agendamento online</span>
          <h1>Agendar horário</h1>
        </header>

        {envio.status === 'confirmado' ? (
          <Confirmado
            codigo={envio.agendamento.id}
            nomeCliente={envio.agendamento.cliente.nome}
            itens={itens(envio.agendamento.barbeiroId)}
            onNovo={reiniciar}
          />
        ) : (
          <>
            <div ref={etapasRef} className="ancora-etapas">
              <Etapas atual={estado.etapa} onIrPara={irPara} />
            </div>

            <div className="agendamento-grade">
              <form className="painel" onSubmit={aoEnviar} noValidate>
                <header className="painel-cabecalho">
                  <span className="painel-passo">
                    Etapa {estado.etapa + 1} de {ETAPAS.length}
                  </span>
                  <h2 ref={tituloRef} tabIndex={-1}>
                    {etapaAtual.titulo}
                  </h2>
                  <p>{etapaAtual.descricao}</p>
                </header>

                <div className="painel-conteudo">{conteudoEtapa()}</div>

                {envio.status === 'erro' && (
                  <div className="alerta alerta--erro" role="alert">
                    <AlertCircle size={20} aria-hidden="true" />
                    <p>{envio.mensagem}</p>
                    <button
                      type="button"
                      className="botao-texto"
                      onClick={() => {
                        setEnvio({ status: 'parado' })
                        despachar({ tipo: 'trocarHorario' })
                      }}
                    >
                      Escolher outro horário
                    </button>
                  </div>
                )}

                <footer className="painel-rodape">
                  {estado.etapa > 0 ? (
                    <button
                      type="button"
                      className="botao botao--secundario"
                      onClick={() => irPara(estado.etapa - 1)}
                      aria-label="Voltar"
                      disabled={enviando}
                    >
                      <ArrowLeft size={18} aria-hidden="true" />
                      <span className="rotulo-voltar">Voltar</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="painel-avancar">
                    {estado.etapa < ULTIMA_ETAPA && !podeAvancar && (
                      <span className="painel-aviso">{AVISO_ETAPA[estado.etapa]}</span>
                    )}
                    <button
                      type="submit"
                      className="botao"
                      disabled={(estado.etapa < ULTIMA_ETAPA && !podeAvancar) || enviando}
                    >
                      {estado.etapa < ULTIMA_ETAPA ? (
                        <>
                          Continuar <ArrowRight size={18} aria-hidden="true" />
                        </>
                      ) : enviando ? (
                        <>
                          <Loader2 size={18} className="girando" aria-hidden="true" /> Confirmando…
                        </>
                      ) : (
                        <>
                          Confirmar <span className="rotulo-longo">agendamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </footer>
              </form>

              <Resumo itens={itens(estado.barbeiroId)} compacto={resumoCompacto} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
