# Guia de integração: frontend ↔ backend

O backend já implementa todas as rotas do `frontend/README.md`, com os mesmos
formatos de `frontend/src/types/` e as mesmas mensagens de erro do mock.
Este guia lista **o que precisa mudar no front** para deixar de usar o
`localStorage` e passar a usar a API. As telas quase não mudam: a maior parte
é trocar o corpo das funções em `src/services/`.

## Subindo o backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --app-dir src
```

- API em `http://localhost:8000`; o proxy do Vite já repassa `/api/...`.
- Documentação interativa (dá para testar cada rota): `http://localhost:8000/docs`.
- O banco (`database/barbearia.db`) é criado no primeiro start com os mesmos
  serviços, barbeiros, expediente e conta do dono do mock
  (`dono@jrbarber.com` / `jrbarber123`). Para zerar, apague o arquivo.

## Convenções da API

| Assunto | Como funciona |
| --- | --- |
| JSON | camelCase, igual aos tipos do front (`duracaoMin`, `servicoNome`...) |
| Sessão | Cookie `httpOnly` criado no login/cadastro. O `fetch` envia sozinho (mesma origem pelo proxy); **o front não guarda token nenhum** |
| Erros | Sempre `{"detail": "mensagem pronta em português"}` |
| Erros de formulário (422) | `{"detail": "primeira mensagem", "erros": {"nome": "...", "telefone": "..."}}` |
| Sem login | `401`; rota do painel sem ser dono: `403` |
| Horário ocupado | `409` |
| `canceladoPor` | Só vem no JSON quando o agendamento foi cancelado |

## 1. Criar um helper de requisições

Novo arquivo `src/services/api.ts`. Ele transforma o `detail` do backend no
`Error.message` que as telas já exibem hoje.

```ts
export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem)
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
    throw new ErroApi(corpo?.detail ?? 'Algo deu errado. Tente novamente.', resposta.status)
  }
  return resposta.status === 204 ? (undefined as T) : resposta.json()
}

export const enviar = (corpo: unknown) => ({ method: 'POST', body: JSON.stringify(corpo) })
```

## 2. Trocar o corpo das funções em `src/services/`

As assinaturas podem continuar iguais. Os parâmetros `usuario` / `usuarioId` passam a ser
**ignorados**: o backend sempre usa o usuário da sessão (por segurança).

### `agendamentoApi.ts`

| Função | Nova implementação |
| --- | --- |
| `listarServicos()` | `api<Servico[]>('/servicos')` |
| `listarBarbeiros()` | `api<Barbeiro[]>('/barbeiros')` |
| `listarHorarios(data, servicoId, barbeiroId)` | `` api<Horario[]>(`/horarios?data=${data}&servico=${encodeURIComponent(servicoId)}&barbeiro=${encodeURIComponent(barbeiroId)}`) `` |
| `criarAgendamento(novo)` | `api<Agendamento>('/agendamentos', enviar(novo))` |
| `listarMeusAgendamentos()` | `api<Agendamento[]>('/agendamentos/meus')` |
| `cancelarAgendamento(id)` | `` api<void>(`/agendamentos/${encodeURIComponent(id)}/cancelar`, { method: 'POST' }) `` |

`podeCancelar`, `inicioAgendamento` e as constantes podem ficar: servem só para
mostrar/esconder botões. Quem decide de verdade é o backend.

### `painelApi.ts`

| Função | Nova implementação |
| --- | --- |
| `agendaDoDia(data)` | `` api<Agendamento[]>(`/painel/agenda?data=${data}`) `` |
| `listarTodosServicos()` | `api<Servico[]>('/painel/servicos')` |
| `salvarServico(dados, id?)` | sem `id`: `api<Servico>('/painel/servicos', enviar(dados))`; com `id`: `` api<Servico>(`/painel/servicos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }) `` |

### `authApi.ts`

| Função | Nova implementação |
| --- | --- |
| `entrar(credenciais)` | `api<Usuario>('/auth/entrar', enviar(credenciais))` |
| `cadastrar(dados)` | `api<Usuario>('/auth/cadastro', enviar(dados))` |
| `entrarComGoogle(credencial)` | `api<Usuario>('/auth/google', enviar({ credencial }))`. Ver item 5 |
| `sair()` | **vira assíncrona**: `api<void>('/auth/sair', { method: 'POST' })` |
| `sessaoAtual()` | **vira assíncrona**. Ver item 3 |

```ts
export async function sessaoAtual(): Promise<Usuario | null> {
  try {
    return await api<Usuario>('/auth/eu')
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) return null
    throw e
  }
}
```

Depois disso, `armazenamento.ts`, `rede.ts` e boa parte de `dadosExemplo.ts`
deixam de ser usados (o `donoExemplo` ainda aparece na nota de demonstração do `Entrar.tsx`).

## 3. Sessão: carregar ao abrir o site (`AuthProvider`)

Hoje `useState(() => authApi.sessaoAtual())` é síncrono. Com o cookie httpOnly,
o front **não consegue ler a sessão sozinho**: precisa perguntar ao backend.

1. `AuthProvider`: começar com um estado `carregando = true`, chamar
   `authApi.sessaoAtual()` num `useEffect` e, ao terminar, preencher `usuario` e
   `carregando = false`.
2. Expor `carregando` no `ContextoAuth`.
3. `RotaProtegida`: enquanto `carregando`, mostrar um esqueleto/spinner. **Sem isso,
   quem já está logado é mandado para `/entrar` ao recarregar a página.**
4. `Entrar`/`Cadastro`: o mesmo cuidado antes do `<Navigate>` de "já logado".
5. `sair` no contexto: `await authApi.sair()` antes de `setUsuario(null)`.

## 4. Horário de funcionamento: usar a API

`diaAberto()` lê `funcionamentoExemplo`, que é fixo no front. O backend tem a
rota nova:

```
GET /api/funcionamento
{
  "intervaloMin": 30,
  "diasAgendamento": 14,
  "dias": [null, null, {"abre": "09:00", "fecha": "19:00"}, ..., {"abre": "08:00", "fecha": "16:00"}]
}
```

`dias[0]` é domingo (igual ao `getDay()`); `null` = fechado. Sugestão:

```ts
export type Funcionamento = {
  intervaloMin: number
  diasAgendamento: number
  dias: ({ abre: string; fecha: string } | null)[]
}

export const obterFuncionamento = () => api<Funcionamento>('/funcionamento')

export const diaAberto = (data: Date, f: Funcionamento) => f.dias[data.getDay()] !== null
```

Em `EtapaHorario` e `AgendaDoDia`: `useRecurso('funcionamento', obterFuncionamento)`
e passar o resultado para `diaAberto`. `diasAgendamento` pode substituir o
`DIAS_VISIVEIS = 14` de `EtapaHorario` (o backend recusa datas fora desse período).

## 5. Login com Google (quando forem ativar)

O backend espera o **ID token** do Google Identity Services:
`POST /api/auth/google` com `{"credencial": "<token>"}`.

1. Criar um *OAuth Client ID* (tipo Web) no Google Cloud com a origem
   `http://localhost:5173`. O mesmo ID vai no front (`VITE_GOOGLE_CLIENT_ID`) e no
   backend (`GOOGLE_CLIENT_ID`).
2. Carregar `https://accounts.google.com/gsi/client` e chamar
   `google.accounts.id.initialize({ client_id, callback: (r) => entrarComGoogle(r.credential) })`.
3. O fluxo de ID token exige o botão desenhado pelo próprio Google
   (`google.accounts.id.renderButton`), então o `BotaoGoogle.tsx` atual precisa ser
   substituído/adaptado.

Enquanto o backend estiver sem `GOOGLE_CLIENT_ID`, a rota responde `501` com
"Login com Google ainda não configurado." (o front já mostra isso como erro).

Se já existir conta **com senha** usando o mesmo e-mail do Google, o backend
responde `409` ("Já existe uma conta com este e-mail. Entre com e-mail e senha.").
Juntar as contas automaticamente ainda é uma decisão em aberto.

## 6. Testes do front

Os testes em `frontend/tests/` usam o mock do `localStorage`. Depois da troca,
eles vão precisar simular o `fetch` (por exemplo com `vi.spyOn(globalThis, 'fetch')`
ou MSW).

## 7. Produção

O cookie de sessão é `SameSite=Lax`: front e back precisam ficar **no mesmo
domínio** (ex.: o servidor web entrega o `dist/` do front e repassa `/api` ao
backend). Em HTTPS, subir o backend com `COOKIE_SEGURO=1`.
