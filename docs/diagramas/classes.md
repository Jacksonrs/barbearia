# Diagrama de Classes (domínio)

Classes do domínio como estão no backend (`backend/src/app/models.py`). Os tipos
seguem o banco; `?` indica um campo que pode ficar vazio.

```mermaid
classDiagram
    direction LR

    class Usuario {
        +String id
        +String nome
        +String? telefone
        +String? email
        +Papel papel
        +Provedor provedor
        -String? senhaHash
        -String? googleSub
        +DateTime criadoEm
    }

    class Sessao {
        -String tokenHash
        +DateTime expiraEm
        +valida() bool
    }

    class Servico {
        +String id
        +String nome
        +String descricao
        +int duracaoMin
        +int precoCentavos
        +bool ativo
        +int ordem
    }

    class Barbeiro {
        +String id
        +String nome
        +String especialidade
        +int ordem
    }

    class Expediente {
        +int diaSemana
        +int? abreMin
        +int? fechaMin
        +aberto() bool
    }

    class Agendamento {
        +String id
        +Date data
        +String hora
        +String servicoNome
        +int duracaoMin
        +int precoCentavos
        +String clienteNome
        +String clienteTelefone
        +String clienteEmail
        +String clienteObservacao
        +Status status
        +Papel? canceladoPor
        +DateTime criadoEm
        +inicio() DateTime
        +clientePodeCancelar(agora) bool
        +cancelar(por: Papel)
    }

    class Papel {
        <<enumeration>>
        cliente
        dono
    }

    class Provedor {
        <<enumeration>>
        senha
        google
    }

    class Status {
        <<enumeration>>
        confirmado
        cancelado
    }

    Usuario "1" -- "0..*" Sessao : possui
    Usuario "1" -- "0..*" Agendamento : faz
    Servico "1" -- "0..*" Agendamento : é agendado em
    Barbeiro "1" -- "0..*" Agendamento : atende
    Usuario ..> Papel
    Usuario ..> Provedor
    Agendamento ..> Status
```

## Observações

- **Agendamento copia dados** do serviço (`servicoNome`, `duracaoMin`, `precoCentavos`) e do contato
  (`cliente*`) no momento da criação (RN21, RN22). Por isso, o histórico não muda se o
  serviço ou a conta forem alterados depois.
- **Expediente** tem 7 registros, um por dia da semana (0 = domingo). Horários
  vazios indicam que a barbearia está fechada naquele dia.
- **Sessao** guarda só o hash do token. O token em si fica apenas no cookie do
  navegador (RNF02).
- Os métodos do diagrama (`inicio`, `clientePodeCancelar`, `aberto`) representam as
  regras de `regras.py`, que no código são funções separadas das classes.
