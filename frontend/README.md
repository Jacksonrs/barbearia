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

## Agendamento online

A tela `/agendar` tem 4 etapas: serviço → barbeiro → dia e horário → dados do
cliente, com resumo ao lado e tela de confirmação no final.

**Enquanto o backend não existe, os dados são simulados** em
`src/services/dadosExemplo.ts` (serviços, barbeiros e horário de funcionamento
fictícios). Toda a comunicação passa por `src/services/agendamentoApi.ts`: para
ligar no backend, basta trocar o corpo das funções por `fetch`, sem mexer nas
telas.

### Endpoints esperados do backend

| Método | Rota                                                       | Retorno                     |
| ------ | ---------------------------------------------------------- | --------------------------- |
| GET    | `/api/servicos`                                            | `Servico[]`                 |
| GET    | `/api/barbeiros`                                           | `Barbeiro[]`                |
| GET    | `/api/horarios?data=AAAA-MM-DD&servico=ID&barbeiro=ID`     | `Horario[]`                 |
| POST   | `/api/agendamentos` (corpo: `NovoAgendamento`)             | `AgendamentoConfirmado`     |

- `barbeiro=sem-preferencia` significa "qualquer barbeiro livre"; nesse caso o
  backend escolhe e devolve o barbeiro em `barbeiroIdFinal`.
- Se o horário já foi ocupado, o `POST` deve responder com erro (ex.: `409`) e
  uma mensagem — o front mostra a mensagem e oferece escolher outro horário.
- Os formatos (`Servico`, `Horario` etc.) estão em `src/types/agendamento.ts`.

## Estrutura

```
frontend/
├── public/           # Arquivos estáticos (favicon etc.)
├── src/
│   ├── components/   # Componentes reutilizáveis (Layout, etapas do agendamento...)
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
