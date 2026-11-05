/**
 * Login e cadastro (SIMULADOS no navegador).
 *
 * No backend real: as senhas ficam criptografadas, o login devolve um token
 * (ou cookie de sessão) e o "Entrar com Google" usa o OAuth do Google com
 * um Client ID da barbearia. A tela não precisa mudar.
 */
import type { Credenciais, DadosCadastro, Usuario } from '../types/usuario.ts'
import { alterarBanco, lerBanco, type UsuarioArmazenado } from './armazenamento.ts'
import { esperar } from './rede.ts'

const CHAVE_SESSAO = 'jrbarber:sessao'
let sessaoMemoria: string | null = null

function lerSessao(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_SESSAO)
  } catch {
    return sessaoMemoria
  }
}

function gravarSessao(usuarioId: string | null) {
  sessaoMemoria = usuarioId
  try {
    if (usuarioId) window.localStorage.setItem(CHAVE_SESSAO, usuarioId)
    else window.localStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // Sem armazenamento: a sessão dura só enquanto a página estiver aberta.
  }
}

function publico(u: UsuarioArmazenado): Usuario {
  return {
    id: u.id,
    nome: u.nome,
    telefone: u.telefone,
    email: u.email,
    papel: u.papel,
    provedor: u.provedor,
  }
}

const digitos = (texto: string) => texto.replace(/\D/g, '')
const normalizarEmail = (email: string) => email.trim().toLowerCase()

export function sessaoAtual(): Usuario | null {
  const id = lerSessao()
  if (!id) return null
  const usuario = lerBanco().usuarios.find((u) => u.id === id)
  return usuario ? publico(usuario) : null
}

export async function entrar({ tipo, identificador, senha }: Credenciais): Promise<Usuario> {
  await esperar()

  const usuario = lerBanco().usuarios.find((u) =>
    tipo === 'email'
      ? u.email !== '' && normalizarEmail(u.email) === normalizarEmail(identificador)
      : u.telefone !== '' && digitos(u.telefone) === digitos(identificador),
  )
  if (!usuario || usuario.senha === null || usuario.senha !== senha) {
    throw new Error(tipo === 'email' ? 'E-mail ou senha incorretos.' : 'Telefone ou senha incorretos.')
  }

  gravarSessao(usuario.id)
  return publico(usuario)
}

/** Simulação: no backend real, abre a janela de login do Google. */
export async function entrarComGoogle(): Promise<Usuario> {
  await esperar()

  const usuario = alterarBanco((banco) => {
    let conta = banco.usuarios.find((u) => u.id === 'google-exemplo')
    if (!conta) {
      conta = {
        id: 'google-exemplo',
        nome: 'Cliente Google',
        email: 'cliente.google@exemplo.com',
        telefone: '',
        papel: 'cliente',
        provedor: 'google',
        senha: null,
      }
      banco.usuarios.push(conta)
    }
    return conta
  })

  gravarSessao(usuario.id)
  return publico(usuario)
}

export async function cadastrar(dados: DadosCadastro): Promise<Usuario> {
  await esperar()

  const usuario = alterarBanco((banco) => {
    const telefone = digitos(dados.telefone)
    const email = normalizarEmail(dados.email)

    if (banco.usuarios.some((u) => u.telefone !== '' && digitos(u.telefone) === telefone)) {
      throw new Error('Já existe uma conta com este telefone. Tente entrar.')
    }
    if (email && banco.usuarios.some((u) => u.email !== '' && normalizarEmail(u.email) === email)) {
      throw new Error('Já existe uma conta com este e-mail. Tente entrar.')
    }

    const nova: UsuarioArmazenado = {
      id: `cli-${crypto.randomUUID().slice(0, 8)}`,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      email,
      papel: 'cliente',
      provedor: 'senha',
      senha: dados.senha,
    }
    banco.usuarios.push(nova)
    return nova
  })

  gravarSessao(usuario.id)
  return publico(usuario)
}

export function sair() {
  gravarSessao(null)
}
