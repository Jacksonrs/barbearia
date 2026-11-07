# Protótipos de Tela

Wireframes de baixa fidelidade das telas **já implementadas**, baseados na versão
real do site. Os textos e as posições são aproximados: a referência visual exata
são as capturas de tela em [`capturas/`](capturas/) (ver o fim deste arquivo).

Todas as telas compartilham o **cabeçalho** (logo, menu e botão "Agendar") e o
**rodapé**. No celular, o menu vira um botão ☰ que abre uma gaveta, e fecha com Esc.

---

## T01 — Página inicial (`/`) · RF07, RF02

```text
┌──────────────────────────────────────────────────────────────┐
│ JR BARBER                     Início  Entrar   [ Agendar ]   │
├──────────────────────────────────────────────────────────────┤
│                                     ┌──────────────────────┐ │
│  Seu estilo, no seu horário.        │  Acesse sua conta    │ │
│  Agende online em poucos cliques.   │  ( E-mail | Telefone)│ │
│                                     │  [______________]    │ │
│  [ Agendar horário ]                │  [______________] 👁 │ │
│                                     │  [     Entrar     ]  │ │
│                                     │  [ G Continuar c/ ]  │ │
│                                     │  Criar conta         │ │
│                                     └──────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  O que fazemos por você                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                │
│  │ Corte    │  │ Barba    │  │ Corte+Barba  │   ← serviços   │
│  │ ⏱ 30 min │  │ ⏱ 30 min │  │ ⏱ 1h         │     ativos     │
│  │ Agendar →│  │ Agendar →│  │ Agendar →    │                │
│  └──────────┘  └──────────┘  └──────────────┘                │
├──────────────────────────────────────────────────────────────┤
│  Seu horário em três passos   1 Escolha  2 Horário  3 Pronto │
├──────────────────────────────────────────────────────────────┤
│  Pronto para o próximo corte?             [ Agendar ]        │
└──────────────────────────────────────────────────────────────┘
```

- "Agendar →" em um serviço abre o agendamento já com esse serviço escolhido.
- No celular, o quadro de login fica escondido e "Agendar" leva para `/entrar`.
- Quem já está logado é levado direto para a sua área (cliente → Meus agendamentos; dono → Painel).

## T02 — Entrar (`/entrar`) e Criar conta (`/cadastro`) · RF01, RF02, RF03

```text
┌───────────────────────────┐     ┌───────────────────────────┐
│ Entrar                    │     │ Criar conta               │
│ ( E-mail | Telefone )     │     │ Nome      [____________]  │
│ E-mail  [______________]  │     │ Telefone  [(__) _____-___]│
│ Senha   [______________]👁│     │ E-mail    [____________]  │
│                           │     │           (opcional)      │
│ [        Entrar        ]  │     │ Senha     [____________]👁│
│ ─────────── ou ────────── │     │                           │
│ [ G Continuar com Google ]│     │ [      Criar conta     ]  │
│ Ainda não tem conta?      │     │ Já tem conta? Entrar      │
│ Criar conta               │     └───────────────────────────┘
└───────────────────────────┘
```

- O telefone recebe a máscara `(00) 00000-0000` enquanto o usuário digita.
- Os erros aparecem abaixo de cada campo. Erros do servidor aparecem acima do botão.
- Depois de entrar, o usuário volta para a página que tinha pedido login.

## T03 — Agendar (`/agendar`) · RF08–RF13

```text
┌──────────────────────────────────────────────────────────────┐
│ Agendar horário                                              │
│ (1 Serviço)─(2 Barbeiro)─(3 Horário)─(4 Seus dados)          │
├────────────────────────────────────────┬─────────────────────┤
│ Escolha o dia e o horário              │ Resumo              │
│                                        │ Serviço: Corte      │
│ [Ter 10] [Qua 11] [Qui 12] [Sex 13]    │ Barbeiro: Junior    │
│ [Sáb 14] [Dom 15 ✕] [Seg 16 ✕] …       │ Dia: Ter, 10/11     │
│                                        │ Horário: —          │
│ 09:00  09:30  [10:00]  10:30  ·11:00·  │ Duração: 30 min     │
│ 11:30  12:00  …                        │                     │
│                                        │                     │
│ [ ← Voltar ]              [ Continuar ]│                     │
└────────────────────────────────────────┴─────────────────────┘
```

| Etapa | Conteúdo |
| --- | --- |
| 1 Serviço | Cartões dos serviços ativos (nome, descrição, duração) |
| 2 Barbeiro | "Sem preferência" + cartões dos barbeiros (nome, especialidade) |
| 3 Horário | Dias da janela de 14 dias (fechados desativados) e grade de horários (`[ ]` = escolhido, `·  ·` = ocupado) |
| 4 Seus dados | Nome, telefone, e-mail e observação, preenchidos com a conta |
| Confirmado | Código `JR-XXXXXX`, barbeiro definido, data, hora e atalhos para "Meus agendamentos" |

- "Continuar" só fica habilitado depois de escolher a opção da etapa.
- No celular, o resumo vira uma barra curta no rodapé, que expande ao tocar.

## T04 — Meus agendamentos (`/meus-agendamentos`) · RF14, RF15

```text
┌──────────────────────────────────────────────────────────────┐
│ Meus agendamentos                          [ Novo agendamento]│
│                                                              │
│ Próximos                                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Ter, 10/11 · 10:00   Corte · Junior · 30 min  JR-A1B2C3  │ │
│ │                                            [ Cancelar ]  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Histórico                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Sáb, 01/11 · 09:00   Barba · Rafael        ● Cancelado   │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- "Cancelar" só aparece quando faltam 2 horas ou mais, e pede confirmação ("Confirmar cancelamento").

## T05 — Painel: agenda do dia (`/painel`) · RF16–RF19

```text
┌──────────────────────────────────────────────────────────────┐
│ Painel da barbearia        [ Agenda ]  [ Serviços ]          │
│                                                              │
│ [◀]  Terça, 10 de novembro (hoje)  [▶]   Barbeiro [Todos ▾] ⟳│
│                                                              │
│ 09:00  Corte · Junior        Ana Souza   📞 Ligar  💬 WhatsApp│
│                                                  [Cancelar]  │
│ 10:00  Corte+Barba · Rafael  João Lima   📞 Ligar  💬 WhatsApp│
│ 11:30  Barba · Lucas         ● Cancelado pelo cliente        │
└──────────────────────────────────────────────────────────────┘
```

- Mostra também os cancelados, com a indicação de quem cancelou.
- Quando o dia não é hoje, aparece o atalho "Voltar para hoje".

## T06 — Painel: serviços (`/painel/servicos`) · RF20

```text
┌──────────────────────────────────────────────────────────────┐
│ Serviços                                    [ + Novo serviço]│
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Corte         30 min   ● Ativo     [Editar] [Desativar]  │ │
│ │ Barba         30 min   ● Ativo     [Editar] [Desativar]  │ │
│ │ Pigmentação   45 min   ○ Inativo   [Editar] [Ativar]     │ │
│ └──────────────────────────────────────────────────────────┘ │
│ Formulário: Nome [____] Descrição [____] Duração [30 min ▾]  │
└──────────────────────────────────────────────────────────────┘
```

---

## Telas planejadas (ainda não implementadas)

| Tela | Requisito | Ideia |
| --- | --- | --- |
| Painel: barbeiros | RF21 | Lista com nome, especialidade e ativo/inativo, igual à de serviços |
| Painel: funcionamento | RF22 | 7 linhas (dom–sáb) com "Fechado" ou abertura/fechamento |
| Painel: bloqueios | RF23 | Data, período (dia inteiro ou horário), barbeiro ou "todos" e motivo |

## Capturas de tela

As capturas ainda precisam ser tiradas com o site rodando (`npm run dev` no
frontend e o backend ligado), salvas em `docs/prototipos/capturas/`, com nomes como
`t01-inicio.png`, `t03-agendar.png` etc.
