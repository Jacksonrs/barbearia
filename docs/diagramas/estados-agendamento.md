# Diagrama de Estados — Agendamento

```mermaid
stateDiagram-v2
    [*] --> Confirmado: Cliente confirma o agendamento (horário livre)

    Confirmado --> Cancelado: Cliente cancela [faltam 2h ou mais]
    Confirmado --> Cancelado: Dono cancela [a qualquer momento]
    Confirmado --> Realizado: Horário passa

    Cancelado --> [*]
    Realizado --> [*]

    note right of Confirmado
        Ocupa o barbeiro durante
        toda a duração do serviço.
    end note

    note right of Cancelado
        Libera o horário.
        Registra quem cancelou.
        Nunca volta a confirmado.
    end note
```

## Observação

No banco existem só dois status: `confirmado` e `cancelado`. **Realizado** é um
estado derivado: é um agendamento confirmado cujo horário já passou. É assim que a
tela "Meus agendamentos" separa "Próximos" de "Histórico". Ainda não há registro
de **não comparecimento**, que pode ser um requisito futuro.
