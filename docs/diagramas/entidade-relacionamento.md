# Diagrama Entidade-Relacionamento

Modelo físico do banco (SQLite no desenvolvimento, PostgreSQL em produção).
As tabelas são criadas pelo backend na primeira execução.

```mermaid
erDiagram
    USUARIOS ||--o{ SESSOES : "possui"
    USUARIOS ||--o{ AGENDAMENTOS : "faz"
    SERVICOS ||--o{ AGENDAMENTOS : "é agendado em"
    BARBEIROS ||--o{ AGENDAMENTOS : "atende"

    USUARIOS {
        varchar36 id PK
        varchar120 nome
        varchar20 telefone "como digitado; pode ser nulo"
        varchar11 telefone_digitos UK "só dígitos"
        varchar254 email UK "minúsculas; pode ser nulo"
        varchar10 papel "cliente | dono"
        varchar10 provedor "senha | google"
        varchar255 senha_hash "argon2; nulo se Google"
        varchar255 google_sub UK
        datetime criado_em "UTC"
    }

    SESSOES {
        varchar64 token_hash PK "SHA-256 do token"
        varchar36 usuario_id FK "ON DELETE CASCADE"
        datetime expira_em "UTC"
    }

    SERVICOS {
        varchar60 id PK "slug do nome"
        varchar40 nome
        varchar120 descricao
        int duracao_min
        int preco_centavos "0 = sem preço"
        boolean ativo
        int ordem
    }

    BARBEIROS {
        varchar60 id PK
        varchar80 nome
        varchar120 especialidade
        int ordem
    }

    EXPEDIENTE {
        int dia_semana PK "0 = domingo"
        int abre_min "minutos desde 00:00; nulo = fechado"
        int fecha_min
    }

    AGENDAMENTOS {
        varchar12 id PK "JR-XXXXXX"
        varchar36 cliente_id FK
        varchar60 servico_id FK
        varchar60 barbeiro_id FK
        date data
        varchar5 hora "HH:MM"
        varchar40 servico_nome "cópia"
        int duracao_min "cópia"
        varchar120 cliente_nome
        varchar20 cliente_telefone
        varchar254 cliente_email
        varchar200 cliente_observacao
        varchar12 status "confirmado | cancelado"
        varchar10 cancelado_por "cliente | dono"
        datetime criado_em "UTC"
    }
```

## Índices e restrições

| Tabela | Restrição | Motivo |
| --- | --- | --- |
| `usuarios` | `telefone_digitos` único | Um telefone por conta (RN02) |
| `usuarios` | `email` único | Um e-mail por conta (RN03) |
| `usuarios` | `google_sub` único | Uma conta por usuário Google |
| `agendamentos` | índice `(data, barbeiro_id)` | Agenda do dia e verificação de conflito rápidas |
| `agendamentos` | índice `cliente_id` | "Meus agendamentos" |

`EXPEDIENTE` não tem relacionamento com as outras tabelas: é uma tabela de configuração.
