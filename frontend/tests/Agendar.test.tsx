import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

beforeAll(() => {
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})

function renderizar() {
  render(
    <MemoryRouter initialEntries={['/agendar']}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const continuar = () => screen.getByRole('button', { name: /continuar/i })

/** Avança pelas etapas de serviço, barbeiro e horário. */
async function escolherAteDados(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(await screen.findByRole('radio', { name: 'Corte + Barba' }))
  await usuario.click(continuar())

  await usuario.click(await screen.findByRole('radio', { name: 'Sem preferência' }))
  await usuario.click(continuar())

  // Procura o primeiro dia aberto que tenha algum horário livre.
  const dias = within(screen.getByRole('group', { name: 'Dia' }))
    .getAllByRole('radio')
    .filter((dia) => !(dia as HTMLInputElement).disabled)

  for (const dia of dias) {
    await usuario.click(dia)
    const grupoHorario = screen.getByRole('group', { name: /horário/i })
    await within(grupoHorario).findByText(/livres?|nenhum horário/i)
    const livre = within(grupoHorario)
      .queryAllByRole('radio')
      .find((hora) => !(hora as HTMLInputElement).disabled)
    if (livre) {
      await usuario.click(livre)
      break
    }
  }

  await usuario.click(continuar())
  await screen.findByRole('heading', { level: 2, name: 'Seus dados' })
}

describe('Agendamento', () => {
  it('só permite continuar depois de escolher o serviço', async () => {
    const usuario = renderizar()
    expect(continuar()).toBeDisabled()
    await usuario.click(await screen.findByRole('radio', { name: 'Corte' }))
    expect(continuar()).toBeEnabled()
  })

  it('mostra a escolha no resumo', async () => {
    const usuario = renderizar()
    await usuario.click(await screen.findByRole('radio', { name: 'Barba' }))
    const resumo = screen.getByRole('complementary', { name: 'Resumo do agendamento' })
    expect(within(resumo).getByText('Barba · 30 min')).toBeInTheDocument()
  })

  it('mostra o resumo curto e permite abrir o resumo completo (celular)', async () => {
    const usuario = renderizar()
    const alternar = screen.getByRole('button', { name: /resumo/i })
    expect(alternar).toHaveTextContent('Nada escolhido ainda')

    await usuario.click(await screen.findByRole('radio', { name: 'Corte' }))
    expect(alternar).toHaveTextContent('Corte')

    expect(alternar).toHaveAttribute('aria-expanded', 'false')
    await usuario.click(alternar)
    expect(alternar).toHaveAttribute('aria-expanded', 'true')
  })

  it('valida os dados do cliente antes de confirmar', async () => {
    const usuario = renderizar()
    await escolherAteDados(usuario)

    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe seu telefone.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
  })

  it('formata o telefone enquanto digita', async () => {
    const usuario = renderizar()
    await escolherAteDados(usuario)

    const telefone = screen.getByLabelText('Telefone / WhatsApp')
    await usuario.type(telefone, '11987654321')
    expect(telefone).toHaveValue('(11) 98765-4321')
  })

  it('conclui um agendamento completo', async () => {
    const usuario = renderizar()
    await escolherAteDados(usuario)

    await usuario.type(screen.getByLabelText('Nome completo'), 'Maria Souza')
    await usuario.type(screen.getByLabelText('Telefone / WhatsApp'), '11987654321')
    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    expect(
      await screen.findByRole('heading', { name: 'Agendamento confirmado!' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/tudo certo, maria/i)).toBeInTheDocument()
    expect(screen.getByText(/^JR-/)).toBeInTheDocument()
  })
})
