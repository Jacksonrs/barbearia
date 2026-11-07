# Requisitos Funcionais

**Atores**

- **Visitante:** quem acessa o site sem estar logado.
- **Cliente:** quem tem conta e está logado.
- **Dono:** administração da barbearia, com conta única criada pelo sistema.
- **Google:** sistema externo usado no login com Google.

**Prioridade:** Essencial (o sistema não funciona sem), Importante, Desejável.
**Situação:** ✅ Implementado · 🟡 Parcial · ⬜ Planejado.

As regras citadas (RNxx) estão em [regras-de-negocio.md](regras-de-negocio.md).

## Contas

| ID | Requisito | Ator | Prioridade | Regras | Situação |
| --- | --- | --- | --- | --- | --- |
| RF01 | O sistema deve permitir **criar conta** informando nome, telefone, e-mail (opcional) e senha. Ao terminar, o cliente já fica logado. | Visitante | Essencial | RN02, RN03, RN04 | ✅ |
| RF02 | O sistema deve permitir **entrar** com e-mail ou telefone e senha. | Visitante | Essencial | RN05, RN06 | ✅ |
| RF03 | O sistema deve permitir **entrar com a conta Google**. | Visitante, Google | Desejável | RN10, RN11 | 🟡 Backend pronto; falta configurar o botão oficial do Google |
| RF04 | O sistema deve **manter o usuário logado** ao recarregar ou reabrir o site, até a sessão expirar ou ele sair. | Cliente, Dono | Importante | RN07 | ✅ |
| RF05 | O sistema deve permitir **sair** da conta. | Cliente, Dono | Essencial | — | ✅ |
| RF06 | O sistema deve mostrar no menu as opções de acordo com o perfil: o cliente vê "Agendar" e "Meus agendamentos", e o dono vê também o "Painel". | Cliente, Dono | Importante | RN08 | ✅ |

## Agendamento (cliente)

| ID | Requisito | Ator | Prioridade | Regras | Situação |
| --- | --- | --- | --- | --- | --- |
| RF07 | O sistema deve exibir na **página inicial** a apresentação da barbearia e os serviços ativos, com descrição e duração. | Visitante | Importante | RN32 | ✅ |
| RF08 | O sistema deve permitir **agendar um horário** em 4 etapas: (1) serviço, (2) barbeiro ou "sem preferência", (3) dia e horário, (4) dados de contato. | Cliente | Essencial | RN01, RN18 | ✅ |
| RF09 | O sistema deve mostrar os **dias disponíveis** dentro da janela de agendamento, marcando os dias em que a barbearia está fechada. | Cliente | Essencial | RN12, RN14 | ✅ |
| RF10 | O sistema deve mostrar os **horários do dia escolhido**, indicando quais estão livres para o serviço e o barbeiro selecionados. | Cliente | Essencial | RN13, RN15, RN16, RN17 | ✅ |
| RF11 | O sistema deve **preencher os dados de contato** com os da conta e permitir alterá-los só para aquele agendamento, com observação opcional. | Cliente | Importante | RN22 | ✅ |
| RF12 | O sistema deve exibir um **resumo** (serviço, barbeiro, data, horário, duração) antes de confirmar. | Cliente | Importante | — | ✅ |
| RF13 | O sistema deve **confirmar o agendamento** e mostrar o código, o barbeiro definido e os detalhes. | Cliente | Essencial | RN19, RN20, RN21 | ✅ |
| RF14 | O sistema deve listar os **agendamentos do cliente**, separados em "Próximos" e "Histórico" (realizados e cancelados). | Cliente | Essencial | RN24, RN28 | ✅ |
| RF15 | O sistema deve permitir que o cliente **cancele** um agendamento próprio, pedindo confirmação antes. | Cliente | Essencial | RN24, RN25, RN27 | ✅ |

## Painel do dono

| ID | Requisito | Ator | Prioridade | Regras | Situação |
| --- | --- | --- | --- | --- | --- |
| RF16 | O sistema deve exibir a **agenda do dia** com todos os agendamentos (inclusive cancelados), em ordem de horário, permitindo trocar de dia. | Dono | Essencial | RN08, RN28 | ✅ |
| RF17 | O sistema deve permitir **filtrar a agenda por barbeiro**. | Dono | Importante | — | ✅ |
| RF18 | O sistema deve oferecer atalhos para **ligar** ou **chamar no WhatsApp** o cliente de um agendamento. | Dono | Importante | — | ✅ |
| RF19 | O sistema deve permitir que o dono **cancele qualquer agendamento**. | Dono | Essencial | RN26, RN27 | ✅ |
| RF20 | O sistema deve permitir **criar e editar serviços** (nome, descrição, duração) e **ativar ou desativar** cada um. | Dono | Essencial | RN29 a RN33 | ✅ |
| RF21 | O sistema deve permitir **cadastrar, editar e desativar barbeiros**. | Dono | Importante | — | ⬜ Hoje só pelo `seed.py` |
| RF22 | O sistema deve permitir **alterar o horário de funcionamento** de cada dia da semana. | Dono | Importante | RN12 | ⬜ Hoje só pelo banco |
| RF23 | O sistema deve permitir **bloquear datas ou períodos** (folgas, feriados), para a barbearia toda ou para um barbeiro. | Dono | Desejável | — | ⬜ |

## Resumo

| Situação | Quantidade |
| --- | --- |
| ✅ Implementado | 19 |
| 🟡 Parcial | 1 (RF03) |
| ⬜ Planejado | 3 (RF21, RF22, RF23) |

A ligação de cada requisito com as telas, as rotas da API e os testes está em
[rastreabilidade.md](rastreabilidade.md).
