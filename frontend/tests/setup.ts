import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// O jsdom não implementa rolagem; o site rola a página ao trocar de rota/etapa.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

beforeEach(() => {
  // Cada teste começa com os dados de exemplo e sem ninguém logado.
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
