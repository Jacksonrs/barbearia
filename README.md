# Jr Barber — Sistema de Agendamento para Barbearia

Projeto da disciplina de Engenharia de Requisitos.

Clientes criam conta, escolhem serviço, barbeiro e horário e acompanham ou
cancelam seus agendamentos pelo site. O dono da barbearia tem um painel com a
agenda do dia e o cadastro de serviços.

## Documentação

Requisitos, regras de negócio, diagramas e protótipos estão em [`docs/`](docs/README.md).

## Stack

| Parte | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router · testes com Vitest + Testing Library |
| Backend | Python 3.12, FastAPI, SQLAlchemy, argon2 · testes com pytest |
| Banco | SQLite (desenvolvimento) · PostgreSQL no Neon (produção) |
| Hospedagem | Vercel (frontend) · Render (backend) |

## Estrutura

```text
barbearia/
├── docs/            # Requisitos, regras de negócio, diagramas e protótipos
├── backend/         # API (FastAPI) — ver backend/INTEGRACAO_FRONTEND.md
│   ├── src/app/     # Rotas, regras de agenda, segurança, banco
│   └── tests/
├── frontend/        # Site (React) — ver frontend/README.md
│   ├── src/
│   └── tests/
├── database/        # Banco SQLite local (gerado automaticamente, fora do git)
└── render.yaml      # Configuração do deploy do backend no Render
```

## Como rodar no computador

Requisitos: **Node.js 20+** e **Python 3.12+**.

### 1. Backend (terminal 1)

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --app-dir src
```

Linux/macOS:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --app-dir src
```

A API fica em <http://localhost:8000>, com a documentação interativa em
<http://localhost:8000/docs>. Na primeira execução, o banco `database/barbearia.db` é
criado com serviços, barbeiros, horário de funcionamento e a conta do dono
(`dono@jrbarber.com` / `jrbarber123`, só para desenvolvimento).

> Se o PowerShell bloquear o `Activate.ps1`, rode uma vez
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Abra <http://localhost:5173>. O Vite repassa as chamadas `/api` para o backend.

### Testes

```bash
cd backend && pytest          # backend (com a .venv ativada)
cd frontend && npm test       # frontend (não precisa do backend)
```

## Produção

- **Backend:** Render, pelo [`render.yaml`](render.yaml). Defina `DATABASE_URL` (Neon),
  `DONO_EMAIL` e `DONO_SENHA` no painel do Render.
- **Frontend:** Vercel, com a pasta raiz `frontend`. Em
  [`frontend/vercel.json`](frontend/vercel.json), troque `SEU-BACKEND` pelo endereço do Render.
- Variáveis e cuidados de segurança: ver a seção "Produção" de
  [`backend/INTEGRACAO_FRONTEND.md`](backend/INTEGRACAO_FRONTEND.md#7-produção).
