# Documentação — Jr Barber

Documentação de Engenharia de Requisitos do sistema de agendamento da barbearia
Jr Barber. Os diagramas usam [Mermaid](https://mermaid.js.org/), que o GitHub e o
VS Code (com a extensão *Markdown Preview Mermaid Support*) mostram como imagem.

## Requisitos

| Documento | Conteúdo |
| --- | --- |
| [Requisitos funcionais](requisitos/requisitos-funcionais.md) | RF01–RF23: o que o sistema faz, por ator, com prioridade e situação |
| [Requisitos não funcionais](requisitos/requisitos-nao-funcionais.md) | RNF01–RNF21: segurança, usabilidade, confiabilidade, tecnologia |
| [Regras de negócio](requisitos/regras-de-negocio.md) | RN01–RN33: prazos, horários, conflitos, cancelamento, serviços |
| [Rastreabilidade](requisitos/rastreabilidade.md) | Requisito → tela → rota da API → testes |

## Diagramas

| Diagrama | Conteúdo |
| --- | --- |
| [Casos de uso](diagramas/casos-de-uso.md) | Atores, casos de uso e descrição detalhada de UC06 (agendar) e UC09 (cancelar) |
| [Classes](diagramas/classes.md) | Classes do domínio e relacionamentos |
| [Entidade-relacionamento](diagramas/entidade-relacionamento.md) | Tabelas, chaves e índices do banco |
| [Sequência](diagramas/sequencia.md) | Login, agendamento e cancelamento |
| [Estados do agendamento](diagramas/estados-agendamento.md) | Confirmado → cancelado / realizado |

## Protótipos

| Documento | Conteúdo |
| --- | --- |
| [Telas](prototipos/telas.md) | Wireframes das 6 telas implementadas e das planejadas |

## Situação atual

- **19** requisitos funcionais implementados, **1** parcial (login com Google) e **3** planejados
  (gerenciar barbeiros, horário de funcionamento e bloqueios de agenda).
- Detalhes em [requisitos-funcionais.md](requisitos/requisitos-funcionais.md#resumo).
