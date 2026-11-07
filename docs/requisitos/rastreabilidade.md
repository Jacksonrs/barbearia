# Matriz de Rastreabilidade

Liga cada requisito funcional à tela que o usuário usa, à rota da API que o
atende e aos testes automatizados que o verificam.

- **Testes do frontend:** `frontend/tests/` (`App`, `Contas`, `Agendar`).
- **Testes do backend:** `backend/tests/` (`test_auth`, `test_publico`, `test_agendamentos`, `test_painel`).

| Requisito | Tela (rota do site) | API | Testes |
| --- | --- | --- | --- |
| RF01 Criar conta | `/cadastro` | `POST /api/auth/cadastro` | Contas: *cria a conta e volta…*, *valida o cadastro…* · test_auth: `test_cadastro_abre_sessao`, `test_telefone_repetido_em_outro_formato`, `test_email_repetido_sem_diferenciar_maiusculas`, `test_validacoes_do_cadastro` |
| RF02 Entrar | `/entrar`, quadro da `/` | `POST /api/auth/entrar` | Contas: *entra com telefone e senha*, *mostra erro com senha errada*, *entra pelo quadro da página inicial…* · test_auth: `test_entrar_por_telefone_e_email`, `test_mesma_mensagem_para_senha_errada_e_conta_inexistente`, `test_limite_de_tentativas`, `test_bloqueio_expira`, `test_bloqueio_feito_por_outra_pessoa_nao_tranca_quem_ja_entrou` |
| RF03 Entrar com Google 🟡 | `/entrar` (botão) | `POST /api/auth/google` | Contas: *avisa que o login com Google ainda não está configurado* · test_auth: `test_google_cria_conta_e_entra_de_novo`, `test_google_nao_vincula_conta_com_senha`, `test_google_com_email_nao_verificado_nao_ocupa_o_email` |
| RF04 Manter logado | todas | `GET /api/auth/eu` | Contas: *cliente logado que abre o início…* · test_auth: `test_sessao_vencida`, `test_cookie_httponly_e_lax`, `test_token_guardado_so_como_hash` |
| RF05 Sair | menu | `POST /api/auth/sair` | Contas: *sai da conta* · test_auth: `test_sair_encerra_a_sessao_no_servidor` |
| RF06 Menu por perfil | menu (`Layout`) | `GET /api/auth/eu` | Contas: *dono logado que abre o início fica no painel*, *bloqueia o painel para clientes* |
| RF07 Página inicial | `/` | `GET /api/servicos` | App: *mostra a página inicial com a marca e os serviços* · test_publico: `test_servicos_ativos_em_camel_case` |
| RF08 Agendar em 4 etapas | `/agendar` | `GET /api/servicos`, `GET /api/barbeiros` | Agendar: *começa no barbeiro quando o serviço vem da página inicial*, *só permite continuar depois de escolher o serviço* · App: *pede login ao tentar agendar…* · test_agendamentos: `test_precisa_de_login` |
| RF09 Dias disponíveis | `/agendar` (etapa 3) | `GET /api/funcionamento` | test_publico: `test_funcionamento`, `test_dias_sem_horario` · test_agendamentos: `test_dia_fechado_e_periodo` |
| RF10 Horários livres | `/agendar` (etapa 3) | `GET /api/horarios` | test_publico: `test_grade_de_horarios_do_dia`, `test_servico_longo_nao_passa_do_fechamento`, `test_respeita_antecedencia_minima`, `test_horario_ocupado_e_sem_preferencia`, `test_servico_longo_bloqueia_horarios_seguintes` |
| RF11 Dados de contato | `/agendar` (etapa 4) | — | Agendar: *preenche os dados com a conta do cliente*, *valida os dados do cliente…*, *formata o telefone enquanto digita* · test_agendamentos: `test_dados_do_cliente_validados` |
| RF12 Resumo | `/agendar` | — | Agendar: *mostra a escolha no resumo*, *mostra o resumo curto…* |
| RF13 Confirmar agendamento | `/agendar` | `POST /api/agendamentos` | Agendar: *conclui o agendamento e ele aparece em "Meus agendamentos"* · test_agendamentos: `test_cria_agendamento`, `test_mesmo_horario_mesmo_barbeiro`, `test_sobreposicao_parcial`, `test_sem_preferencia_escolhe_na_ordem`, `test_antecedencia_minima`, `test_dois_clientes_no_mesmo_horario_ao_mesmo_tempo` |
| RF14 Meus agendamentos | `/meus-agendamentos` | `GET /api/agendamentos/meus` | Contas: *lista e cancela um agendamento* · test_agendamentos: `test_meus_so_do_proprio_cliente_e_em_ordem` |
| RF15 Cliente cancela | `/meus-agendamentos` | `POST /api/agendamentos/{id}/cancelar` | Contas: *lista e cancela um agendamento* · test_agendamentos: `test_cliente_cancela_e_libera_o_horario`, `test_prazo_de_cancelamento_do_cliente`, `test_cliente_nao_ve_agendamento_de_outro` |
| RF16 Agenda do dia | `/painel` | `GET /api/painel/agenda` | Contas: *mostra a agenda do dia com os clientes*, *mostra a qual dia a agenda se refere…* · test_painel: `test_so_o_dono_acessa`, `test_agenda_do_dia` |
| RF17 Filtro por barbeiro | `/painel` | — (filtro na tela) | *sem teste específico* |
| RF18 Ligar / WhatsApp | `/painel` | — (links `tel:` e `wa.me`) | *sem teste específico* |
| RF19 Dono cancela | `/painel` | `POST /api/agendamentos/{id}/cancelar` | test_agendamentos: `test_dono_cancela_qualquer_um_a_qualquer_hora` |
| RF20 Gerenciar serviços | `/painel/servicos` | `GET/POST /api/painel/servicos`, `PUT /api/painel/servicos/{id}` | Contas: *cria um serviço que passa a aparecer…*, *desativa um serviço e ele some…* · test_painel: `test_cria_servico`, `test_nome_repetido`, `test_validacoes_do_servico`, `test_editar_mantem_id_e_historico`, `test_desativar_some_dos_horarios` |
| RF21 Gerenciar barbeiros ⬜ | — | — | — |
| RF22 Horário de funcionamento ⬜ | — | — | — |
| RF23 Bloqueios de agenda ⬜ | — | — | — |

## Lacunas de teste

- **RF17** (filtro por barbeiro) e **RF18** (links de contato) não têm teste automatizado.
- A **trava contra reserva dupla** (RNF12) só é testada com um processo do servidor.
