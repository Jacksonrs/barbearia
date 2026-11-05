import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

beforeAll(() => {
  // O jsdom não implementa rolagem; o Layout rola a página ao trocar de rota.
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})

function renderizar(rota = '/') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('mostra a página inicial com a marca e os serviços', () => {
    renderizar()
    expect(screen.getByRole('heading', { level: 1, name: /estilo e precisão/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /jr barber/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 3, name: 'Corte + Barba' })).toBeInTheDocument()
  })

  it('navega para a página de agendamento', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('link', { name: 'Agendar horário' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Agendar horário' })).toBeInTheDocument()
  })

  it('abre e fecha o menu no celular', async () => {
    renderizar()
    const botao = screen.getByRole('button', { name: 'Abrir menu' })
    expect(botao).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(botao)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('fecha o menu do celular com a tecla Esc', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('mostra aviso para rotas inexistentes', () => {
    renderizar('/qualquer-coisa')
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
