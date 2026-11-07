# Regras de Negócio

Regras que o sistema da **Jr Barber** precisa respeitar, independentemente da tela.
Todas são garantidas **no backend**: o frontend repete algumas só para avisar o
usuário mais cedo, mas quem decide é o servidor.

Os valores entre parênteses mostram onde a regra está configurada no código.

## Contas e acesso

| ID | Regra | Onde é garantida |
| --- | --- | --- |
| RN01 | Só clientes **logados** podem agendar, ver e cancelar agendamentos. A página inicial e a lista de serviços são abertas a visitantes. | `dependencias.usuario_logado` |
| RN02 | O **telefone** é obrigatório no cadastro com senha, precisa ter DDD (10 ou 11 dígitos) e não pode se repetir entre contas. | `schemas.validar_telefone`, coluna `telefone_digitos` única |
| RN03 | O **e-mail** é opcional no cadastro. Quando informado, precisa ser válido e não pode se repetir entre contas (sem diferenciar maiúsculas). | `schemas.validar_email_opcional`, coluna `email` única |
| RN04 | A **senha** precisa ter de 6 a 128 caracteres. | `schemas.DadosCadastro` |
| RN05 | O login aceita **e-mail ou telefone** + senha. Quando o login falha, a mensagem é a mesma para "conta não existe" e "senha errada", para não revelar quais contas existem. | `routers/auth.entrar` |
| RN06 | Depois de **5 senhas erradas em 15 minutos** para a mesma conta, o login dela fica bloqueado até a falha mais antiga completar 15 minutos. Um navegador onde a conta já entrou antes tem contagem própria, para que outra pessoa não consiga trancar o dono da conta para fora. | `limite_login.py` |
| RN07 | A sessão dura **30 dias** (`SESSAO_DIAS`) ou até o usuário sair. | `config.SESSAO_DIAS` |
| RN08 | Existe **uma conta de dono**, criada automaticamente pelo sistema. Ela é a única com acesso ao painel. Nenhum cadastro feito pelo site cria um dono. | `seed.popular`, `dependencias.apenas_dono` |
| RN09 | Em produção, o servidor **não sobe** enquanto o dono usar a senha padrão de desenvolvimento. | `seed._conferir_senha_padrao_do_dono` |
| RN10 | No login com Google, o e-mail só é aproveitado se o Google o marcar como verificado. Se já existir uma conta **com senha** usando esse e-mail, o login é recusado ("Entre com e-mail e senha"). | `routers/auth.entrar_com_google` |
| RN11 | Uma conta criada pelo Google não tem telefone. No primeiro agendamento, ela recebe o telefone informado, desde que nenhuma outra conta o use. | `routers/agendamentos.criar` |

## Agenda e horários

| ID | Regra | Onde é garantida |
| --- | --- | --- |
| RN12 | **Horário de funcionamento:** domingo e segunda fechado; terça a sexta das 09:00 às 19:00; sábado das 08:00 às 16:00. | tabela `expediente` (valores iniciais em `seed.py`) |
| RN13 | Os horários são oferecidos a cada **30 minutos** (`INTERVALO_MIN`), a partir da abertura. O serviço precisa **terminar até o fechamento** (ex.: um serviço de 60 min não começa às 18:30 se fecha às 19:00). | `regras.listar_horarios` |
| RN14 | Só é possível agendar entre **hoje e os próximos 13 dias** (janela de 14 dias, `DIAS_AGENDAMENTO`). | `regras.data_no_periodo` |
| RN15 | O agendamento precisa ser feito com pelo menos **30 minutos de antecedência** (`ANTECEDENCIA_AGENDAR_MIN`). | `regras.listar_horarios`, `routers/agendamentos.criar` |
| RN16 | Um barbeiro **não pode ter dois agendamentos confirmados que se sobreponham**, considerando a duração de cada serviço. Agendamentos cancelados liberam o horário. | `regras.livre`, `regras.ocupacao_do_dia` |
| RN17 | Um horário aparece como disponível quando **pelo menos um** barbeiro que pode atender está livre durante toda a duração do serviço. | `regras.listar_horarios` |
| RN18 | **Sem preferência de barbeiro:** o sistema escolhe o primeiro barbeiro livre na ordem de cadastro, e o agendamento já sai com o barbeiro definido. | `regras.primeiro_barbeiro_livre` |
| RN19 | Se dois clientes tentarem o mesmo horário ao mesmo tempo, só o primeiro consegue. O segundo recebe "Esse horário acabou de ser ocupado". | `routers/agendamentos._trava_agenda` |
| RN20 | Cada agendamento recebe um **código** no formato `JR-XXXXXX` (6 caracteres hexadecimais), mostrado ao cliente na confirmação. | `routers/agendamentos._novo_codigo` |
| RN21 | O agendamento guarda uma **cópia do nome e da duração do serviço** do momento em que foi feito. Mudanças posteriores no serviço não alteram agendamentos já feitos. | colunas `servico_nome`, `duracao_min` |
| RN22 | Os **dados de contato** do agendamento (nome, telefone, e-mail, observação) vêm preenchidos com os da conta, mas podem ser alterados só para aquele agendamento. A observação tem até 200 caracteres. | `schemas.DadosCliente` |
| RN23 | Todas as regras de data e hora usam o fuso **America/Sao_Paulo** (`FUSO`). | `config.FUSO` |

## Cancelamento

| ID | Regra | Onde é garantida |
| --- | --- | --- |
| RN24 | O **cliente** só vê e cancela os **próprios** agendamentos. Se tentar acessar um agendamento de outra pessoa, recebe "não encontrado", como se ele não existisse. | `routers/agendamentos.meus`, `cancelar` |
| RN25 | O cliente só pode cancelar até **2 horas antes** do horário (`ANTECEDENCIA_CANCELAMENTO_MIN`). | `regras.cliente_pode_cancelar` |
| RN26 | O **dono** pode cancelar qualquer agendamento, a qualquer momento. | `routers/agendamentos.cancelar` |
| RN27 | Um agendamento cancelado não pode ser cancelado de novo nem voltar a ficar confirmado. O sistema registra **quem cancelou** (cliente ou dono). | coluna `cancelado_por` |
| RN28 | Agendamentos **não são apagados**: os cancelados continuam no histórico do cliente e na agenda do dono. | — |

## Serviços

| ID | Regra | Onde é garantida |
| --- | --- | --- |
| RN29 | O **nome** do serviço tem de 2 a 40 caracteres e não pode se repetir (sem diferenciar maiúsculas). | `schemas.DadosServico`, `routers/painel._nome_repetido` |
| RN30 | A **descrição** tem de 5 a 120 caracteres. | `schemas.DadosServico` |
| RN31 | A **duração** é uma destas opções: 15, 30, 45, 60, 75, 90 ou 120 minutos (`DURACOES_PERMITIDAS`). | `config.DURACOES_PERMITIDAS` |
| RN32 | Serviços **não são excluídos**, só desativados. Um serviço inativo some da página inicial e do agendamento, mas continua no histórico. | `routers/publico.servicos_ativos` |
| RN33 | Renomear um serviço não muda o identificador dele, então os agendamentos antigos continuam ligados ao mesmo serviço. | `routers/painel.atualizar_servico` |
