import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { criarAgendamento, listarServicos } from '../src/services/agendamentoApi.ts'
import * as authApi from '../src/services/authApi.ts'
import { donoExemplo } from './dados/dadosExemplo.ts'
import { SEM_PREFERENCIA } from '../src/types/agendamento.ts'
import {
  CLIENTE,
  entrarComoCliente,
  entrarComoDono,
  primeiroHorarioLivre,
  renderizar,
} from './utilitarios.tsx'

describe('Entrar e cadastro', () => {
  it('cria a conta e volta para a página que pediu o login', async () => {
    const usuario = await renderizar('/agendar')
    await usuario.click(screen.getByRole('link', { name: 'Criar conta' }))

    await usuario.type(screen.getByLabelText('Nome completo'), 'João Lima')
    await usuario.type(screen.getByLabelText('Telefone / WhatsApp'), '11911112222')
    await usuario.type(screen.getByLabelText('Senha'), 'minhasenha')
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Agendar horário' })).toBeInTheDocument()
  })

  it('valida o cadastro antes de enviar', async () => {
    const usuario = await renderizar('/cadastro')
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(screen.getByText(/pelo menos 6 caracteres/)).toBeInTheDocument()
  })

  it('entra com telefone e senha', async () => {
    await entrarComoCliente()
    await authApi.sair()

    const usuario = await renderizar('/entrar')
    await usuario.click(screen.getByRole('radio', { name: 'Telefone' }))
    await usuario.type(screen.getByLabelText('Telefone', { selector: 'input[type=tel]' }), '11987654321')
    await usuario.type(screen.getByLabelText('Senha'), CLIENTE.senha)
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Meus agendamentos' })).toBeInTheDocument()
  })

  it('mostra erro com senha errada', async () => {
    const usuario = await renderizar('/entrar')
    await usuario.type(screen.getByLabelText('E-mail', { selector: 'input[type=email]' }), donoExemplo.email)
    await usuario.type(screen.getByLabelText('Senha'), 'errada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('avisa que o login com Google ainda não está configurado', async () => {
    const usuario = await renderizar('/entrar')
    await usuario.click(await screen.findByRole('button', { name: 'Continuar com Google' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Login com Google ainda não configurado.')
  })

  it('sai da conta', async () => {
    await entrarComoCliente()
    const usuario = await renderizar('/meus-agendamentos')
    await usuario.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    // Volta para a página inicial pública.
    expect(screen.getByRole('heading', { level: 1, name: /estilo e precisão/i })).toBeInTheDocument()
  })

  it('cliente logado que abre o início fica nos seus agendamentos', async () => {
    await entrarComoCliente()
    await renderizar('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Meus agendamentos' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Início' })).not.toBeInTheDocument()
  })

  it('dono logado que abre o início fica no painel', async () => {
    await entrarComoDono()
    await renderizar('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Painel da barbearia' })).toBeInTheDocument()
  })
})

describe('Meus agendamentos', () => {
  it('lista e cancela um agendamento', async () => {
    const cliente = await entrarComoCliente()
    const { data, hora } = await primeiroHorarioLivre()
    await criarAgendamento(
      {
        servicoId: 'corte',
        barbeiroId: SEM_PREFERENCIA,
        data,
        hora,
        cliente: { nome: cliente.nome, telefone: cliente.telefone, email: '', observacao: '' },
      },
    )

    const usuario = await renderizar('/meus-agendamentos')
    const item = (await screen.findByRole('heading', { level: 3, name: 'Corte' })).closest('li')!
    await usuario.click(within(item).getByRole('button', { name: 'Cancelar agendamento' }))
    await usuario.click(within(item).getByRole('button', { name: 'Sim, cancelar' }))

    await waitFor(() => expect(screen.getByText('Cancelado')).toBeInTheDocument())
    expect(screen.getByText('Você não tem horários marcados.')).toBeInTheDocument()
    expect(screen.getByText('Agendamento cancelado. O horário foi liberado.')).toBeInTheDocument()
  })
})

describe('Painel do dono', () => {
  it('mostra a qual dia a agenda se refere e volta para hoje', async () => {
    await entrarComoDono()
    const usuario = await renderizar('/painel')
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar para hoje' })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Próximo dia' }))
    await usuario.click(screen.getByRole('button', { name: 'Próximo dia' }))
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Voltar para hoje' }))
    expect(screen.getByText('Hoje')).toBeInTheDocument()
  })

  it('bloqueia o painel para clientes', async () => {
    await entrarComoCliente()
    await renderizar('/painel')
    expect(screen.getByRole('heading', { level: 1, name: 'Acesso restrito' })).toBeInTheDocument()
  })

  it('mostra a agenda do dia com os clientes', async () => {
    const cliente = await entrarComoCliente()
    const { data, hora } = await primeiroHorarioLivre()
    await criarAgendamento(
      {
        servicoId: 'corte',
        barbeiroId: SEM_PREFERENCIA,
        data,
        hora,
        cliente: { nome: cliente.nome, telefone: cliente.telefone, email: '', observacao: 'Degradê baixo' },
      },
    )
    await entrarComoDono()

    await renderizar('/painel')
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: data } })

    const titulo = await screen.findByRole('heading', { level: 3, name: 'Maria Souza' })
    const item = titulo.closest('li')!
    expect(within(item).getByText('“Degradê baixo”')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511987654321',
    )
  })

  it('cria um serviço que passa a aparecer para os clientes', async () => {
    await entrarComoDono()
    const usuario = await renderizar('/painel/servicos')

    await usuario.click(await screen.findByRole('button', { name: 'Novo serviço' }))
    const form = screen.getByRole('form', { name: 'Novo serviço' })
    await usuario.type(within(form).getByLabelText('Nome'), 'Sobrancelha')
    await usuario.type(within(form).getByLabelText('Descrição'), 'Alinhamento na navalha.')
    await usuario.selectOptions(within(form).getByLabelText('Duração'), '15')
    await usuario.click(within(form).getByRole('button', { name: 'Salvar serviço' }))

    expect(await screen.findByRole('heading', { level: 3, name: 'Sobrancelha' })).toBeInTheDocument()
    expect((await listarServicos()).map((s) => s.nome)).toContain('Sobrancelha')
  })

  it('desativa um serviço e ele some do agendamento', async () => {
    await entrarComoDono()
    const usuario = await renderizar('/painel/servicos')

    const item = (await screen.findByRole('heading', { level: 3, name: 'Barba' })).closest('li')!
    await usuario.click(within(item).getByRole('button', { name: 'Desativar' }))

    // A lista é recarregada: busca o card de novo.
    await waitFor(() => {
      const atualizado = screen.getByRole('heading', { level: 3, name: 'Barba' }).closest('li')!
      expect(within(atualizado).getByText('Inativo')).toBeInTheDocument()
    })
    expect((await listarServicos()).map((s) => s.nome)).not.toContain('Barba')
  })
})
