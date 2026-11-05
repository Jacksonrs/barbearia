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
backend Python em `http://localhost:8000` (configurado em `vite.config.ts`).
Assim o front pode chamar, por exemplo, `fetch('/api/servicos')` sem se
preocupar com CORS.

## Telas

| Rota                  | Quem acessa      | O que faz                                                   |
| --------------------- | ---------------- | ----------------------------------------------------------- |
| `/`                   | Todos            | Página inicial com os serviços ativos                       |
| `/entrar`, `/cadastro`| Todos            | Login com e-mail, telefone ou Google; criação de conta      |
| `/agendar`            | Logado           | Agendamento em 4 etapas, com dados da conta já preenchidos  |
| `/meus-agendamentos`  | Logado           | Próximos horários e histórico; cancelar até 2h antes        |
| `/painel`             | Só o dono        | Agenda do dia: clientes, telefone/WhatsApp, cancelar        |
| `/painel/servicos`    | Só o dono        | Criar, editar, ativar e desativar serviços                  |

## Dados de exemplo (enquanto o backend não existe)

Tudo é **simulado no navegador** e salvo no `localStorage`, para o fluxo
funcionar de ponta a ponta: o que o cliente agenda aparece no painel do dono, e o
que o dono altera aparece para o cliente.

- Dados iniciais (serviços, barbeiros, horário de funcionamento, uma agenda
  parcialmente ocupada com clientes fictícios): `src/services/dadosExemplo.ts`
- **Conta do dono para testes:** `dono@jrbarber.com` / `jrbarber123`
- O botão "Continuar com Google" é uma simulação (entra numa conta de exemplo).
- Para recomeçar do zero, apague os dados do site no navegador
  (DevTools → Application → Local Storage).

Toda a comunicação passa por `src/services/` (`agendamentoApi.ts`,
`authApi.ts`, `painelApi.ts`). Para ligar no backend, basta trocar o corpo das
funções por `fetch`, sem mexer nas telas.

## Endpoints esperados do backend

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
│   ├── services/     # Acesso à API (e dados de exemplo)
│   ├── styles/       # CSS global, variáveis de cor e estilos por tela
│   ├── types/        # Tipos TypeScript compartilhados
│   ├── utils/        # Funções auxiliares (datas, telefone, validação)
│   ├── App.tsx       # Rotas
│   └── main.tsx      # Ponto de entrada
└── tests/            # Testes automatizados
```
