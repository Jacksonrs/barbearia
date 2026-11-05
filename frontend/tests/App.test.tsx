import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

function renderizar(rota = '/') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('mostra a página inicial com o nome da barbearia', () => {
    renderizar()
    expect(screen.getByRole('heading', { level: 1, name: 'Jr Barber' })).toBeInTheDocument()
  })

  it('navega para a página de agendamento', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('link', { name: 'Agendar horário' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Agendar horário' })).toBeInTheDocument()
  })

  it('mostra aviso para rotas inexistentes', () => {
    renderizar('/qualquer-coisa')
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
  })
})
