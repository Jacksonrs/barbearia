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

## Estrutura

```
frontend/
├── public/           # Arquivos estáticos (favicon etc.)
├── src/
│   ├── components/   # Componentes reutilizáveis (Layout...)
│   ├── pages/        # Uma pasta/arquivo por tela
│   ├── styles/       # CSS global e variáveis de cor
│   ├── App.tsx       # Rotas
│   └── main.tsx      # Ponto de entrada
└── tests/            # Testes automatizados
```
