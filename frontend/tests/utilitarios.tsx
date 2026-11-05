import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.tsx'
import { listarHorarios } from '../src/services/agendamentoApi.ts'
import * as authApi from '../src/services/authApi.ts'
import { donoExemplo } from '../src/services/dadosExemplo.ts'
import { SEM_PREFERENCIA } from '../src/types/agendamento.ts'
import { paraIso } from '../src/utils/datas.ts'

export function renderizar(rota = '/') {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

export const CLIENTE = {
  nome: 'Maria Souza',
  telefone: '(11) 98765-4321',
  email: 'maria@exemplo.com',
  senha: 'segredo123',
}

/** Cria a conta da cliente de teste e deixa ela logada (antes de renderizar). */
export const entrarComoCliente = () => authApi.cadastrar(CLIENTE)

export const entrarComoDono = () =>
  authApi.entrar({ tipo: 'email', identificador: donoExemplo.email, senha: donoExemplo.senha })

/** Primeiro horário livre a partir de amanhã (garante mais de 2h de antecedência). */
export async function primeiroHorarioLivre(servicoId = 'corte') {
  for (let i = 1; i <= 14; i++) {
    const dia = new Date()
    dia.setDate(dia.getDate() + i)
    const data = paraIso(dia)
    const livre = (await listarHorarios(data, servicoId, SEM_PREFERENCIA)).find((h) => h.disponivel)
    if (livre) return { data, hora: livre.hora }
  }
  throw new Error('Nenhum horário livre nos dados de exemplo.')
}
