/**
 * "Banco de dados" de exemplo, salvo no navegador (localStorage).
 * Existe só enquanto o backend não está pronto: assim o que o cliente agenda
 * aparece no painel do dono, e o que o dono altera aparece para o cliente.
 * Se o navegador bloquear o armazenamento, os dados ficam só na memória.
 */
import type { Agendamento, Barbeiro, Servico } from '../types/agendamento.ts'
import type { Usuario } from '../types/usuario.ts'
import {
  barbeirosExemplo,
  donoExemplo,
  gerarAgendamentosExemplo,
  servicosExemplo,
} from './dadosExemplo.ts'

/** No backend real a senha NUNCA é guardada assim — lá ela fica criptografada (hash). */
export type UsuarioArmazenado = Usuario & { senha: string | null }

export type BancoDados = {
  versao: 1
  servicos: Servico[]
  barbeiros: Barbeiro[]
  agendamentos: Agendamento[]
  usuarios: UsuarioArmazenado[]
}

const CHAVE = 'jrbarber:dados:v1'
let memoria: BancoDados | null = null

function armazenamento(): Storage | null {
  try {
    const s = window.localStorage
    s.getItem(CHAVE)
    return s
  } catch {
    return null
  }
}

function criarBancoExemplo(): BancoDados {
  return {
    versao: 1,
    servicos: structuredClone(servicosExemplo),
    barbeiros: structuredClone(barbeirosExemplo),
    agendamentos: gerarAgendamentosExemplo(),
    usuarios: [{ ...donoExemplo, papel: 'dono', provedor: 'senha' }],
  }
}

export function lerBanco(): BancoDados {
  const s = armazenamento()
  if (!s) {
    memoria ??= criarBancoExemplo()
    return memoria
  }
  try {
    const texto = s.getItem(CHAVE)
    if (texto) {
      const banco = JSON.parse(texto) as BancoDados
      if (banco?.versao === 1) return banco
    }
  } catch {
    // Dados corrompidos: recomeça com os dados de exemplo.
  }
  const novo = criarBancoExemplo()
  salvarBanco(novo)
  return novo
}

export function salvarBanco(banco: BancoDados) {
  memoria = banco
  try {
    armazenamento()?.setItem(CHAVE, JSON.stringify(banco))
  } catch {
    // Sem espaço ou bloqueado: segue só com a memória.
  }
}

/** Lê, altera e salva. Se `alterar` lançar um erro, nada é salvo. */
export function alterarBanco<T>(alterar: (banco: BancoDados) => T): T {
  const banco = lerBanco()
  const resultado = alterar(banco)
  salvarBanco(banco)
  return resultado
}
