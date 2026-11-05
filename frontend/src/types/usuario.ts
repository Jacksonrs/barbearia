export type Papel = 'cliente' | 'dono'

export type Usuario = {
  id: string
  nome: string
  telefone: string
  email: string
  papel: Papel
  /** Como a conta entra: com senha (e-mail ou telefone) ou pelo Google. */
  provedor: 'senha' | 'google'
}

export type TipoLogin = 'email' | 'telefone'

export type Credenciais = {
  tipo: TipoLogin
  identificador: string
  senha: string
}

export type DadosCadastro = {
  nome: string
  telefone: string
  email: string
  senha: string
}
