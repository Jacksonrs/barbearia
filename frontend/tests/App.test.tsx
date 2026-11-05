import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderizar } from './utilitarios.tsx'

describe('App', () => {
  it('mostra a página inicial com a marca e os serviços', async () => {
    renderizar()
    expect(screen.getByRole('heading', { level: 1, name: /estilo e precisão/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /jr barber/i }).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { level: 3, name: 'Corte + Barba' })).toBeInTheDocument()
  })

  it('pede login ao tentar agendar sem estar logado', async () => {
    const usuario = renderizar()
    await usuario.click(screen.getByRole('link', { name: 'Agendar horário' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('abre e fecha o menu no celular', async () => {
    const usuario = renderizar()
    const botao = screen.getByRole('button', { name: 'Abrir menu' })
    expect(botao).toHaveAttribute('aria-expanded', 'false')
    await usuario.click(botao)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('fecha o menu do celular com a tecla Esc', async () => {
    const usuario = renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await usuario.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('mostra aviso para rotas inexistentes', () => {
    renderizar('/qualquer-coisa')
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
