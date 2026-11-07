# Requisitos Não Funcionais

## Segurança

| ID | Requisito | Como é atendido |
| --- | --- | --- |
| RNF01 | As senhas devem ser guardadas apenas como **hash** seguro, nunca em texto. | Argon2 (`argon2-cffi`), em `seguranca.py` |
| RNF02 | A sessão não pode ficar acessível a scripts da página. | Cookie `httpOnly`, `SameSite=Lax` e `Secure` em produção (`COOKIE_SEGURO=1`). O banco guarda só o hash SHA-256 do token |
| RNF03 | Toda permissão deve ser conferida **no servidor**: esconder a tela no front não conta como proteção. | `401` sem login; `403` no painel para quem não é dono; cliente só acessa os próprios agendamentos |
| RNF04 | O sistema deve dificultar **adivinhação de senha**. | Limite de 5 tentativas a cada 15 min por conta, com contagem separada por navegador confiável (RN06) |
| RNF05 | O sistema não deve revelar **quais contas existem**. | Mensagem única de erro no login e verificação de hash falso, para o tempo de resposta ser o mesmo |
| RNF06 | Segredos (senha do banco, senha do dono, chave de assinatura) não podem ficar no repositório. | Variáveis de ambiente; `.env*` no `.gitignore`; o `render.yaml` usa `sync: false` |

## Usabilidade e acessibilidade

| ID | Requisito | Como é atendido |
| --- | --- | --- |
| RNF07 | O site deve funcionar bem em **celular** e computador. | Layout responsivo; o agendamento foi pensado primeiro para o celular |
| RNF08 | Todas as mensagens devem estar em **português**, em linguagem simples. | O backend devolve `{"detail": "mensagem pronta"}`, que o front mostra direto |
| RNF09 | Os erros de formulário devem aparecer **junto ao campo**, durante o preenchimento. | Validação no front (`utils/cliente.ts`) igual à do backend; o `422` também traz `erros` por campo |
| RNF10 | O site deve ser utilizável por **leitores de tela e teclado**. | Rótulos `aria-label`, títulos por tela, foco visível, botões nativos |
| RNF11 | Enquanto carrega, o usuário deve ver um indicador, e em caso de falha, uma opção de **tentar de novo**. | Esqueletos de carregamento e componente de erro com "Tentar novamente" (`useRecurso`) |

## Confiabilidade e desempenho

| ID | Requisito | Como é atendido |
| --- | --- | --- |
| RNF12 | Dois clientes **não podem reservar o mesmo horário** com o mesmo barbeiro. | Nova verificação dentro de uma trava antes de gravar. **Limitação:** a trava vale para um processo do servidor; com vários processos, será preciso trava no banco (`SELECT ... FOR UPDATE`) |
| RNF13 | O histórico dos agendamentos não pode mudar quando um serviço for editado. | Cópia do nome e da duração no agendamento (RN21) |
| RNF14 | Datas e horas devem seguir o horário de **Brasília**, independentemente de onde o servidor esteja. | Fuso `America/Sao_Paulo` em todas as regras |
| RNF15 | As telas principais devem responder em até **2 segundos** em uma conexão comum. | Front estático (Vite) e consultas simples com índice por data e barbeiro. *Não medido formalmente* |

## Manutenção, portabilidade e implantação

| ID | Requisito | Como é atendido |
| --- | --- | --- |
| RNF16 | O frontend deve usar **React + TypeScript**. | React 19, TypeScript, Vite e React Router |
| RNF17 | O backend deve expor uma **API REST em JSON**. | Python 3.12 + FastAPI; documentação automática em `/docs` |
| RNF18 | O sistema deve rodar com **SQLite** no desenvolvimento e **PostgreSQL** em produção, sem mudar o código. | SQLAlchemy; a escolha do banco vem da variável `DATABASE_URL` |
| RNF19 | O código deve ter **testes automatizados**. | Frontend: Vitest + Testing Library, com backend falso. Backend: pytest, com banco temporário e relógio fixo |
| RNF20 | O sistema deve poder ser publicado em serviços **gratuitos**. | Frontend na Vercel, backend no Render e banco no Neon (`render.yaml`, `vercel.json`) |
| RNF21 | Front e back devem ficar no **mesmo domínio**, para o cookie de sessão funcionar. | Proxy do Vite no desenvolvimento e redirecionamento `/api` da Vercel em produção |
