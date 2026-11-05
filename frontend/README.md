# Jr Barber — Frontend

Interface do sistema de gerenciamento da barbearia Jr Barber.

## Stack

- React + TypeScript
- Vite (servidor de desenvolvimento e build)
- React Router (navegação entre telas)
- Vitest + Testing Library (testes)
- Oxlint (lint)

## Como rodar

Requer Node.js 20 ou superior.

```bash
npm install      # instala as dependências (só na primeira vez)
npm run dev      # abre em http://localhost:5173
```

O site precisa do backend rodando ao mesmo tempo (ver `backend/INTEGRACAO_FRONTEND.md`):

```bash
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --app-dir src
```

## Comandos

| Comando           | O que faz                            |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento          |
| `npm test`        | Roda os testes (modo observação)     |
| `npm run lint`    | Verifica o código                    |
| `npm run build`   | Gera a versão de produção em `dist/` |
| `npm run preview` | Abre a versão de produção localmente |

## Integração com o backend

Durante o desenvolvimento, toda requisição para `/api/...` é repassada para o
backend Python em `http://localhost:8000` (configurado em `vite.config.ts`),
então não há CORS e o cookie de sessão funciona sozinho.

- Toda a comunicação passa por `src/services/` (`agendamentoApi.ts`,
  `authApi.ts`, `painelApi.ts`), usando o helper `api()` de `src/services/api.ts`.
  Ele transforma o `detail` dos erros do backend na mensagem mostrada na tela.
- A sessão é um cookie `httpOnly`: o front não guarda token. Ao abrir o site, o
  `AuthProvider` pergunta ao backend quem está logado (`GET /api/auth/eu`).
- **Conta do dono** (criada pelo backend no primeiro start): `dono@jrbarber.com` / `jrbarber123`
- "Continuar com Google" mostra um aviso até o botão oficial do Google ser configurado.

## Telas

| Rota                  | Quem acessa      | O que faz                                                   |
| --------------------- | ---------------- | ----------------------------------------------------------- |
| `/`                   | Todos            | Página inicial com os serviços ativos                       |
| `/entrar`, `/cadastro`| Todos            | Login com e-mail, telefone ou Google; criação de conta      |
| `/agendar`            | Logado           | Agendamento em 4 etapas, com dados da conta já preenchidos  |
| `/meus-agendamentos`  | Logado           | Próximos horários e histórico; cancelar até 2h antes        |
| `/painel`             | Só o dono        | Agenda do dia: clientes, telefone/WhatsApp, cancelar        |
| `/painel/servicos`    | Só o dono        | Criar, editar, ativar e desativar serviços                  |

## Testes

Os testes não precisam do backend: `tests/servidorFalso.ts` substitui o `fetch`
e responde às mesmas rotas, com os dados de exemplo de `tests/dados/`.

## Endpoints do backend

Os formatos (`Servico`, `Agendamento`, `Usuario` etc.) estão em `src/types/`.

### Contas

| Método | Rota                    | Corpo / retorno                                          |
| ------ | ----------------------- | -------------------------------------------------------- |
| POST   | `/api/auth/cadastro`    | `DadosCadastro` → `Usuario` + sessão                     |
| POST   | `/api/auth/entrar`      | `Credenciais` (`tipo`: `email` ou `telefone`) → `Usuario` + sessão |
| POST   | `/api/auth/google`      | token do Google → `Usuario` + sessão                     |
| POST   | `/api/auth/sair`        | encerra a sessão                                          |
| GET    | `/api/auth/eu`          | `Usuario` logado (ou `401`)                               |

### Agendamento (cliente logado)

| Método | Rota                                                   | Retorno         |
| ------ | ------------------------------------------------------ | --------------- |
| GET    | `/api/servicos` (só ativos)                            | `Servico[]`     |
| GET    | `/api/barbeiros`                                       | `Barbeiro[]`    |
| GET    | `/api/funcionamento`                                   | `Funcionamento` |
| GET    | `/api/horarios?data=AAAA-MM-DD&servico=ID&barbeiro=ID` | `Horario[]`     |
| POST   | `/api/agendamentos` (corpo: `NovoAgendamento`)         | `Agendamento`   |
| GET    | `/api/agendamentos/meus`                               | `Agendamento[]` |
| POST   | `/api/agendamentos/{id}/cancelar`                      | —               |

### Painel (só o dono — o backend deve recusar outros com `403`)

| Método | Rota                                  | Retorno                   |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/api/painel/agenda?data=AAAA-MM-DD`  | `Agendamento[]` do dia    |
| GET    | `/api/painel/servicos`                | `Servico[]` (com inativos)|
| POST   | `/api/painel/servicos`                | cria → `Servico`          |
| PUT    | `/api/painel/servicos/{id}`           | atualiza → `Servico`      |

### Regras que o backend precisa garantir

- `barbeiro=sem-preferencia` = qualquer barbeiro livre; o backend escolhe e
  devolve o barbeiro em `barbeiroId`.
- Horário já ocupado → erro (ex.: `409`) com mensagem; o front a exibe.
- O cliente só vê e cancela **os próprios** agendamentos, e só até **2 horas
  antes** (`ANTECEDENCIA_CANCELAMENTO_MIN` em `agendamentoApi.ts`). O dono pode
  cancelar qualquer um.
- Senhas guardadas com hash (ex.: bcrypt/argon2) — nunca em texto.
- Esconder telas no front **não é segurança**: cada rota do painel precisa
  checar no servidor se o usuário é o dono.

## Estrutura

```
frontend/
├── public/           # Arquivos estáticos (favicon etc.)
├── src/
│   ├── components/   # Componentes reutilizáveis (Layout, campos, etapas do agendamento...)
│   ├── contexts/     # Login (quem está conectado)
│   ├── hooks/        # Hooks próprios (carregamento de dados)
│   ├── pages/        # Uma pasta/arquivo por tela
│   ├── services/     # Acesso à API do backend
│   ├── styles/       # CSS global, variáveis de cor e estilos por tela
│   ├── types/        # Tipos TypeScript compartilhados
│   ├── utils/        # Funções auxiliares (datas, telefone, validação)
│   ├── App.tsx       # Rotas
│   └── main.tsx      # Ponto de entrada
└── tests/            # Testes automatizados (com backend falso)
```
