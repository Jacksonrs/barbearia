/**
 * Backend falso para os testes: responde às rotas /api como o FastAPI
 * (mesmos caminhos, status e mensagens), usando o banco em memória de tests/dados.
 * A sessão (o "cookie") fica numa variável. Tudo é zerado antes de cada teste.
 */
import { vi } from 'vitest'
import { inicioAgendamento, podeCancelar } from '../src/services/agendamentoApi.ts'
import type { DadosServico } from '../src/services/painelApi.ts'
import {
  SEM_PREFERENCIA,
  type Agendamento,
  type Funcionamento,
  type Horario,
  type NovoAgendamento,
  type Servico,
} from '../src/types/agendamento.ts'
import type { Relatorio } from '../src/types/relatorio.ts'
import type { Credenciais, DadosCadastro, Usuario } from '../src/types/usuario.ts'
import { deIso, horaParaMinutos, minutosParaHora, paraIso } from '../src/utils/datas.ts'
import { lerBanco, zerarBanco, type UsuarioArmazenado } from './dados/armazenamento.ts'
import { funcionamentoExemplo, INTERVALO_MIN } from './dados/dadosExemplo.ts'

const ANTECEDENCIA_AGENDAR_MIN = 30
const DIAS_AGENDAMENTO = 14

let sessao: string | null = null

// ----- Respostas -----

class Falha extends Error {
  readonly status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
const semConteudo = () => new Response(null, { status: 204 })

// ----- Contas -----

const digitos = (texto: string) => texto.replace(/\D/g, '')
const normalizarEmail = (email: string) => email.trim().toLowerCase()

function publico({ senha: _senha, ...usuario }: UsuarioArmazenado): Usuario {
  return usuario
}

function usuarioLogado(): UsuarioArmazenado {
  const usuario = lerBanco().usuarios.find((u) => u.id === sessao)
  if (!usuario) throw new Falha(401, 'Faça login para continuar.')
  return usuario
}

function apenasDono() {
  if (usuarioLogado().papel !== 'dono') {
    throw new Falha(403, 'Esta área é exclusiva da administração da barbearia.')
  }
}

function entrar({ tipo, identificador, senha }: Credenciais) {
  const usuario = lerBanco().usuarios.find((u) =>
    tipo === 'email'
      ? u.email !== '' && normalizarEmail(u.email) === normalizarEmail(identificador)
      : u.telefone !== '' && digitos(u.telefone) === digitos(identificador),
  )
  if (!usuario || usuario.senha === null || usuario.senha !== senha) {
    throw new Falha(401, tipo === 'email' ? 'E-mail ou senha incorretos.' : 'Telefone ou senha incorretos.')
  }
  sessao = usuario.id
  return json(publico(usuario))
}

function cadastrar(dados: DadosCadastro) {
  const telefone = digitos(dados.telefone)
  const email = normalizarEmail(dados.email)
  const { usuarios } = lerBanco()
  if (usuarios.some((u) => u.telefone !== '' && digitos(u.telefone) === telefone)) {
    throw new Falha(409, 'Já existe uma conta com este telefone. Tente entrar.')
  }
  if (email && usuarios.some((u) => u.email !== '' && normalizarEmail(u.email) === email)) {
    throw new Falha(409, 'Já existe uma conta com este e-mail. Tente entrar.')
  }

  const nova: UsuarioArmazenado = {
    id: `cli-${crypto.randomUUID().slice(0, 8)}`,
    nome: dados.nome.trim(),
    telefone: dados.telefone,
    email,
    papel: 'cliente',
    provedor: 'senha',
    senha: dados.senha,
  }
  usuarios.push(nova)
  sessao = nova.id
  return json(publico(nova), 201)
}

// ----- Agenda -----

function funcionamento(): Funcionamento {
  return {
    intervaloMin: INTERVALO_MIN,
    diasAgendamento: DIAS_AGENDAMENTO,
    dias: funcionamentoExemplo.map((e) =>
      e ? { abre: minutosParaHora(e.abre), fecha: minutosParaHora(e.fecha) } : null,
    ),
  }
}

function barbeiroLivre(data: string, barbeiroId: string, inicio: number, duracao: number) {
  return !lerBanco().agendamentos.some((a) => {
    if (a.status !== 'confirmado' || a.data !== data || a.barbeiroId !== barbeiroId) return false
    const inicioOutro = horaParaMinutos(a.hora)
    return inicio < inicioOutro + a.duracaoMin && inicioOutro < inicio + duracao
  })
}

const candidatos = (barbeiroId: string) =>
  barbeiroId === SEM_PREFERENCIA ? lerBanco().barbeiros.map((b) => b.id) : [barbeiroId]

function listarHorarios(data: string, servicoId: string, barbeiroId: string): Horario[] {
  const servico = lerBanco().servicos.find((s) => s.id === servicoId && s.ativo)
  const expediente = funcionamentoExemplo[deIso(data).getDay()]
  if (!servico || !expediente) return []

  const limite = Date.now() + ANTECEDENCIA_AGENDAR_MIN * 60_000
  const horarios: Horario[] = []
  for (let m = expediente.abre; m + servico.duracaoMin <= expediente.fecha; m += INTERVALO_MIN) {
    const hora = minutosParaHora(m)
    const disponivel =
      inicioAgendamento({ data, hora }).getTime() >= limite &&
      candidatos(barbeiroId).some((id) => barbeiroLivre(data, id, m, servico.duracaoMin))
    horarios.push({ hora, disponivel })
  }
  return horarios
}

function criarAgendamento(novo: NovoAgendamento) {
  const usuario = usuarioLogado()
  const servico = lerBanco().servicos.find((s) => s.id === novo.servicoId && s.ativo)
  if (!servico) throw new Falha(400, 'Este serviço não está mais disponível.')
  if (inicioAgendamento(novo).getTime() < Date.now() + ANTECEDENCIA_AGENDAR_MIN * 60_000) {
    throw new Falha(409, 'Esse horário não está mais disponível. Escolha outro horário.')
  }

  const inicio = horaParaMinutos(novo.hora)
  const barbeiroId = candidatos(novo.barbeiroId).find((id) =>
    barbeiroLivre(novo.data, id, inicio, servico.duracaoMin),
  )
  if (!barbeiroId) throw new Falha(409, 'Esse horário acabou de ser ocupado. Escolha outro horário.')

  const agendamento: Agendamento = {
    id: `JR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    clienteId: usuario.id,
    servicoId: servico.id,
    servicoNome: servico.nome,
    barbeiroId,
    data: novo.data,
    hora: novo.hora,
    duracaoMin: servico.duracaoMin,
    cliente: novo.cliente,
    status: 'confirmado',
    criadoEm: new Date().toISOString(),
  }
  lerBanco().agendamentos.push(agendamento)
  return json(agendamento, 201)
}

function cancelarAgendamento(id: string) {
  const usuario = usuarioLogado()
  const agendamento = lerBanco().agendamentos.find((a) => a.id === id)
  if (!agendamento || (usuario.papel === 'cliente' && agendamento.clienteId !== usuario.id)) {
    throw new Falha(404, 'Agendamento não encontrado.')
  }
  if (agendamento.status !== 'confirmado') throw new Falha(409, 'Este agendamento já foi cancelado.')
  if (usuario.papel === 'cliente' && !podeCancelar(agendamento)) {
    throw new Falha(400, 'O cancelamento só pode ser feito até 2 horas antes do horário.')
  }
  agendamento.status = 'cancelado'
  agendamento.canceladoPor = usuario.papel
  return semConteudo()
}

// ----- Painel -----

function gerarId(nome: string, existentes: Servico[]): string {
  const base =
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'servico'
  let id = base
  for (let n = 2; existentes.some((s) => s.id === id); n++) id = `${base}-${n}`
  return id
}

function salvarServico(dados: DadosServico, id?: string) {
  const { servicos } = lerBanco()
  const nome = dados.nome.trim()
  const descricao = dados.descricao.trim()
  if (servicos.some((s) => s.id !== id && s.nome.toLowerCase() === nome.toLowerCase())) {
    throw new Falha(409, 'Já existe um serviço com esse nome.')
  }

  if (id) {
    const servico = servicos.find((s) => s.id === id)
    if (!servico) throw new Falha(404, 'Serviço não encontrado.')
    Object.assign(servico, { ...dados, nome, descricao })
    return json(servico)
  }
  const novo: Servico = { ...dados, nome, descricao, id: gerarId(nome, servicos) }
  servicos.push(novo)
  return json(novo, 201)
}

// ----- Relatório (versão simplificada do backend: usa o preço atual do serviço) -----

function relatorio(inicio: string, fim: string): Relatorio {
  apenasDono()
  const { agendamentos, servicos, barbeiros } = lerBanco()
  const doPeriodo = agendamentos.filter((a) => a.data >= inicio && a.data <= fim)
  const confirmados = doPeriodo.filter((a) => a.status === 'confirmado')
  const cancelados = doPeriodo.filter((a) => a.status === 'cancelado')
  const preco = (a: Agendamento) => servicos.find((s) => s.id === a.servicoId)?.precoCentavos ?? 0
  const faturamento = confirmados.reduce((soma, a) => soma + preco(a), 0)

  const agrupar = (chave: (a: Agendamento) => string, nome: (id: string) => string) => {
    const grupos = new Map<string, Agendamento[]>()
    for (const a of confirmados) grupos.set(chave(a), [...(grupos.get(chave(a)) ?? []), a])
    return [...grupos].map(([id, lista]) => ({
      id,
      nome: nome(id),
      quantidade: lista.length,
      faturamentoCentavos: lista.reduce((soma, a) => soma + preco(a), 0),
    }))
  }

  const porDia = []
  for (let d = deIso(inicio); d <= deIso(fim); d.setDate(d.getDate() + 1)) {
    const data = paraIso(d)
    const doDia = confirmados.filter((a) => a.data === data)
    porDia.push({ data, quantidade: doDia.length, faturamentoCentavos: doDia.reduce((s, a) => s + preco(a), 0) })
  }
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0]
  for (const a of confirmados) porDiaSemana[deIso(a.data).getDay()]++
  const clientes = agrupar((a) => a.clienteId, () => '')

  return {
    inicio,
    fim,
    agendamentos: confirmados.length,
    cancelados: cancelados.length,
    canceladosPeloCliente: cancelados.filter((a) => a.canceladoPor === 'cliente').length,
    faturamentoCentavos: faturamento,
    faturamentoRealizadoCentavos: confirmados
      .filter((a) => inicioAgendamento(a).getTime() <= Date.now())
      .reduce((soma, a) => soma + preco(a), 0),
    ticketMedioCentavos: confirmados.length ? Math.round(faturamento / confirmados.length) : 0,
    clientes: clientes.length,
    clientesNovos: clientes.length,
    porServico: agrupar((a) => a.servicoId, (id) => servicos.find((s) => s.id === id)?.nome ?? id),
    porBarbeiro: agrupar((a) => a.barbeiroId, (id) => barbeiros.find((b) => b.id === id)?.nome ?? id),
    porDiaSemana,
    porHora: agrupar((a) => `${a.hora.slice(0, 2)}:00`, (h) => h).map((h) => ({
      hora: h.id,
      quantidade: h.quantidade,
    })),
    porDia,
    clientesFrequentes: clientes.map((c) => {
      const a = confirmados.find((x) => x.clienteId === c.id)!
      return { nome: a.cliente.nome, telefone: a.cliente.telefone, quantidade: c.quantidade }
    }),
  }
}

// ----- Rotas -----

function rotear(metodo: string, url: URL, corpo: any): Response {
  const caminho = url.pathname.replace(/^\/api/, '')
  const busca = url.searchParams
  const rota = `${metodo} ${caminho}`

  switch (rota) {
    case 'GET /auth/eu':
      return json(publico(usuarioLogado()))
    case 'POST /auth/entrar':
      return entrar(corpo)
    case 'POST /auth/cadastro':
      return cadastrar(corpo)
    case 'POST /auth/sair':
      sessao = null
      return semConteudo()

    case 'GET /servicos':
      return json(lerBanco().servicos.filter((s) => s.ativo))
    case 'GET /barbeiros':
      return json(lerBanco().barbeiros)
    case 'GET /funcionamento':
      return json(funcionamento())
    case 'GET /horarios':
      return json(
        listarHorarios(busca.get('data')!, busca.get('servico')!, busca.get('barbeiro') ?? SEM_PREFERENCIA),
      )

    case 'POST /agendamentos':
      return criarAgendamento(corpo)
    case 'GET /agendamentos/meus': {
      const { id } = usuarioLogado()
      return json(lerBanco().agendamentos.filter((a) => a.clienteId === id))
    }

    case 'GET /painel/agenda':
      apenasDono()
      return json(
        lerBanco()
          .agendamentos.filter((a) => a.data === busca.get('data'))
          .sort((a, b) => a.hora.localeCompare(b.hora)),
      )
    case 'GET /painel/servicos':
      apenasDono()
      return json(lerBanco().servicos)
    case 'POST /painel/servicos':
      apenasDono()
      return salvarServico(corpo)
    case 'GET /painel/relatorio':
      return json(relatorio(busca.get('inicio')!, busca.get('fim')!))
  }

  const cancelar = rota.match(/^POST \/agendamentos\/([^/]+)\/cancelar$/)
  if (cancelar) return cancelarAgendamento(decodeURIComponent(cancelar[1]))

  const editar = rota.match(/^PUT \/painel\/servicos\/([^/]+)$/)
  if (editar) {
    apenasDono()
    return salvarServico(corpo, decodeURIComponent(editar[1]))
  }

  throw new Falha(404, `Rota não simulada nos testes: ${rota}`)
}

async function responder(entrada: RequestInfo | URL, opcoes: RequestInit = {}): Promise<Response> {
  const url = new URL(String(entrada), 'http://localhost')
  const corpo = typeof opcoes.body === 'string' ? JSON.parse(opcoes.body) : undefined
  try {
    return rotear(opcoes.method ?? 'GET', url, corpo)
  } catch (e) {
    if (e instanceof Falha) return json({ detail: e.message }, e.status)
    throw e
  }
}

/** Liga o backend falso (no lugar do fetch), com os dados de exemplo e ninguém logado. */
export function iniciarServidorFalso() {
  zerarBanco()
  sessao = null
  vi.stubGlobal('fetch', vi.fn(responder))
}
