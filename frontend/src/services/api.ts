/**
 * Chamadas ao backend. Em desenvolvimento, o Vite repassa /api para o FastAPI
 * (ver vite.config.ts). A sessão vai num cookie httpOnly: o front não guarda token.
 */

/** Erro vindo do backend, com a mensagem pronta (`detail`) para mostrar na tela. */
export class ErroApi extends Error {
  readonly status: number
  /** Erros por campo nos formulários (respostas 422). */
  readonly erros: Record<string, string>

  constructor(mensagem: string, status: number, erros: Record<string, string> = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.erros = erros
  }
}

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...opcoes,
      headers: opcoes.body ? { 'Content-Type': 'application/json', ...opcoes.headers } : opcoes.headers,
    })
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Tente novamente.', 0)
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const detalhe = typeof corpo?.detail === 'string' ? corpo.detail : 'Algo deu errado. Tente novamente.'
    throw new ErroApi(detalhe, resposta.status, corpo?.erros ?? {})
  }
  return resposta.status === 204 ? (undefined as T) : resposta.json()
}

/** Opções de um POST com corpo JSON. */
export const enviar = (corpo: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(corpo) })
