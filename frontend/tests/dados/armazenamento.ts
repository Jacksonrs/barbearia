/**
 * "Banco de dados" do backend falso dos testes (só em memória).
 * Começa com os dados de exemplo e é zerado antes de cada teste.
 */
import type { Agendamento, Barbeiro, Servico } from '../../src/types/agendamento.ts'
import type { Usuario } from '../../src/types/usuario.ts'
import {
  barbeirosExemplo,
  donoExemplo,
  gerarAgendamentosExemplo,
  servicosExemplo,
} from './dadosExemplo.ts'

/** Só nos testes a senha fica assim; o backend real guarda o hash. */
export type UsuarioArmazenado = Usuario & { senha: string | null }

export type BancoDados = {
  servicos: Servico[]
  barbeiros: Barbeiro[]
  agendamentos: Agendamento[]
  usuarios: UsuarioArmazenado[]
}

function criarBancoExemplo(): BancoDados {
  return {
    servicos: structuredClone(servicosExemplo),
    barbeiros: structuredClone(barbeirosExemplo),
    agendamentos: gerarAgendamentosExemplo(),
    usuarios: [{ ...donoExemplo, papel: 'dono', provedor: 'senha' }],
  }
}

let banco = criarBancoExemplo()

export const lerBanco = () => banco

export function zerarBanco() {
  banco = criarBancoExemplo()
}
