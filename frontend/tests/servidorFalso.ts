/**
 * Backend falso para os testes: responde às rotas /api/auth como o FastAPI
 * (mesmos status e mensagens), guardando as contas no banco de exemplo.
 * A sessão (o "cookie") fica numa variável e é zerada antes de cada teste.
 */
import { vi } from 'vitest'
import { alterarBanco, lerBanco, type UsuarioArmazenado } from '../src/services/armazenamento.ts'
import type { Credenciais, DadosCadastro, Usuario } from '../src/types/usuario.ts'

let sessao: string | null = null

const digitos = (texto: string) => texto.replace(/\D/g, '')
const normalizarEmail = (email: string) => email.trim().toLowerCase()

function publico({ senha: _senha, ...usuario }: UsuarioArmazenado): Usuario {
  return usuario
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
const erro = (status: number, detail: string) => json({ detail }, status)

function entrar({ tipo, identificador, senha }: Credenciais) {
  const usuario = lerBanco().usuarios.find((u) =>
    tipo === 'email'
      ? u.email !== '' && normalizarEmail(u.email) === normalizarEmail(identificador)
      : u.telefone !== '' && digitos(u.telefone) === digitos(identificador),
  )
  if (!usuario || usuario.senha === null || usuario.senha !== senha) {
    return erro(401, tipo === 'email' ? 'E-mail ou senha incorretos.' : 'Telefone ou senha incorretos.')
  }
  sessao = usuario.id
  return json(publico(usuario))
}

function cadastrar(dados: DadosCadastro) {
  const telefone = digitos(dados.telefone)
  const email = normalizarEmail(dados.email)
  const { usuarios } = lerBanco()
  if (usuarios.some((u) => u.telefone !== '' && digitos(u.telefone) === telefone)) {
    return erro(409, 'Já existe uma conta com este telefone. Tente entrar.')
  }
  if (email && usuarios.some((u) => u.email !== '' && normalizarEmail(u.email) === email)) {
    return erro(409, 'Já existe uma conta com este e-mail. Tente entrar.')
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
  alterarBanco((banco) => {
    banco.usuarios.push(nova)
  })
  sessao = nova.id
  return json(publico(nova), 201)
}

async function responder(entrada: RequestInfo | URL, opcoes: RequestInit = {}): Promise<Response> {
  const caminho = new URL(String(entrada), 'http://localhost').pathname
  const metodo = opcoes.method ?? 'GET'
  const corpo = typeof opcoes.body === 'string' ? JSON.parse(opcoes.body) : undefined

  switch (`${metodo} ${caminho}`) {
    case 'GET /api/auth/eu': {
      const usuario = lerBanco().usuarios.find((u) => u.id === sessao)
      return usuario ? json(publico(usuario)) : erro(401, 'Faça login para continuar.')
    }
    case 'POST /api/auth/entrar':
      return entrar(corpo)
    case 'POST /api/auth/cadastro':
      return cadastrar(corpo)
    case 'POST /api/auth/sair':
      sessao = null
      return new Response(null, { status: 204 })
    default:
      return erro(404, `Rota não simulada nos testes: ${metodo} ${caminho}`)
  }
}

/** Liga o backend falso (no lugar do fetch) e começa sem ninguém logado. */
export function iniciarServidorFalso() {
  sessao = null
  vi.stubGlobal('fetch', vi.fn(responder))
}
