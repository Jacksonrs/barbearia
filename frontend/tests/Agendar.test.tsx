import { screen, within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { entrarComoCliente, renderizar } from './utilitarios.tsx'

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
  beforeEach(async () => {
    await entrarComoCliente()
  })

  it('só permite continuar depois de escolher o serviço', async () => {
    const usuario = renderizar('/agendar')
    expect(continuar()).toBeDisabled()
    await usuario.click(await screen.findByRole('radio', { name: 'Corte' }))
    expect(continuar()).toBeEnabled()
  })

  it('mostra a escolha no resumo', async () => {
    const usuario = renderizar('/agendar')
    await usuario.click(await screen.findByRole('radio', { name: 'Barba' }))
    const resumo = screen.getByRole('complementary', { name: 'Resumo do agendamento' })
    expect(within(resumo).getByText('Barba · 30 min')).toBeInTheDocument()
  })

  it('mostra o resumo curto e permite abrir o resumo completo (celular)', async () => {
    const usuario = renderizar('/agendar')
    const alternar = screen.getByRole('button', { name: /resumo/i })
    expect(alternar).toHaveTextContent('Nada escolhido ainda')

    await usuario.click(await screen.findByRole('radio', { name: 'Corte' }))
    expect(alternar).toHaveTextContent('Corte')

    expect(alternar).toHaveAttribute('aria-expanded', 'false')
    await usuario.click(alternar)
    expect(alternar).toHaveAttribute('aria-expanded', 'true')
  })

  it('preenche os dados com a conta do cliente', async () => {
    const usuario = renderizar('/agendar')
    await escolherAteDados(usuario)
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Maria Souza')
    expect(screen.getByLabelText('Telefone / WhatsApp')).toHaveValue('(11) 98765-4321')
  })

  it('valida os dados do cliente antes de confirmar', async () => {
    const usuario = renderizar('/agendar')
    await escolherAteDados(usuario)

    await usuario.clear(screen.getByLabelText('Nome completo'))
    await usuario.clear(screen.getByLabelText('Telefone / WhatsApp'))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))

    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe seu telefone.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveFocus()
  })

  it('formata o telefone enquanto digita', async () => {
    const usuario = renderizar('/agendar')
    await escolherAteDados(usuario)

    const telefone = screen.getByLabelText('Telefone / WhatsApp')
    await usuario.clear(telefone)
    await usuario.type(telefone, '21912345678')
    expect(telefone).toHaveValue('(21) 91234-5678')
  })

  it('conclui o agendamento e ele aparece em "Meus agendamentos"', async () => {
    const usuario = renderizar('/agendar')
    await escolherAteDados(usuario)

    await usuario.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    expect(await screen.findByRole('heading', { name: 'Agendamento confirmado!' })).toBeInTheDocument()
    expect(screen.getByText(/tudo certo, maria/i)).toBeInTheDocument()

    await usuario.click(screen.getByRole('link', { name: 'Ver meus agendamentos' }))
    expect(await screen.findByRole('heading', { level: 3, name: 'Corte + Barba' })).toBeInTheDocument()
  })
})
