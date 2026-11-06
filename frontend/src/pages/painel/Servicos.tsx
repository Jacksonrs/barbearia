import { AlertCircle, Clock, Loader2, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Campo from '../../components/Campo.tsx'
import { ErroCarregamento, Esqueleto } from '../../components/agendamento/Estados.tsx'
import { useAvisos } from '../../contexts/avisos.ts'
import { useRecurso } from '../../hooks/useRecurso.ts'
import { useTitulo } from '../../hooks/useTitulo.ts'
import { listarTodosServicos, salvarServico, type DadosServico } from '../../services/painelApi.ts'
import type { Servico } from '../../types/agendamento.ts'
import { formatarDuracao } from '../../utils/datas.ts'

const DURACOES = [15, 30, 45, 60, 75, 90, 120]
const NOVO = 'novo'

type PropsFormulario = {
  inicial: DadosServico
  titulo: string
  onSalvar: (dados: DadosServico) => Promise<void>
  onCancelar: () => void
}

function FormularioServico({ inicial, titulo, onSalvar, onCancelar }: PropsFormulario) {
  const [dados, setDados] = useState(inicial)
  const [mostrarErros, setMostrarErros] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const erros = {
    nome: dados.nome.trim().length < 2 ? 'Informe o nome do serviço.' : undefined,
    descricao: dados.descricao.trim().length < 5 ? 'Escreva uma descrição curta.' : undefined,
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (erros.nome || erros.descricao) {
      setMostrarErros(true)
      document.getElementById(erros.nome ? 'servico-nome' : 'servico-descricao')?.focus()
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      await onSalvar(dados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
      setSalvando(false)
    }
  }

  return (
    <form className="form-servico" onSubmit={aoEnviar} noValidate aria-label={titulo}>
      <h3>{titulo}</h3>
      <div className="form-servico-campos">
        <Campo id="servico-nome" rotulo="Nome" erro={mostrarErros ? erros.nome : undefined}>
          {(props) => (
            <input
              {...props}
              type="text"
              maxLength={40}
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            />
          )}
        </Campo>

        <Campo id="servico-duracao" rotulo="Duração">
          {(props) => (
            <select
              {...props}
              value={dados.duracaoMin}
              onChange={(e) => setDados({ ...dados, duracaoMin: Number(e.target.value) })}
            >
              {DURACOES.map((d) => (
                <option key={d} value={d}>
                  {formatarDuracao(d)}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo
          id="servico-descricao"
          rotulo="Descrição"
          erro={mostrarErros ? erros.descricao : undefined}
          dica="Aparece para o cliente na hora de agendar."
        >
          {(props) => (
            <textarea
              {...props}
              rows={2}
              maxLength={120}
              value={dados.descricao}
              onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
            />
          )}
        </Campo>

        <label className="interruptor">
          <input
            type="checkbox"
            checked={dados.ativo}
            onChange={(e) => setDados({ ...dados, ativo: e.target.checked })}
          />
          <span className="interruptor-trilho" aria-hidden="true" />
          <span>
            <strong>Disponível para agendamento</strong>
            <small>Desative para esconder dos clientes sem apagar o histórico.</small>
          </span>
        </label>
      </div>

      {erro && (
        <div className="alerta alerta--erro" role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <p>{erro}</p>
        </div>
      )}

      <div className="form-servico-acoes">
        <button type="button" className="botao botao--secundario" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="botao" disabled={salvando}>
          {salvando && <Loader2 size={18} className="girando" aria-hidden="true" />}
          Salvar serviço
        </button>
      </div>
    </form>
  )
}

export default function Servicos() {
  useTitulo('Serviços')
  const avisar = useAvisos()
  const servicos = useRecurso('painel-servicos', listarTodosServicos)
  const [editando, setEditando] = useState<string | null>(null)
  // Serviço sendo ativado/desativado agora (evita clique duplo e mostra o carregamento).
  const [alternando, setAlternando] = useState<string | null>(null)

  async function salvar(dados: DadosServico, id?: string) {
    await salvarServico(dados, id)
    setEditando(null)
    avisar(id ? `“${dados.nome.trim()}” atualizado.` : `“${dados.nome.trim()}” criado.`)
    servicos.recarregar()
  }

  async function alternarAtivo(servico: Servico) {
    const { id, ...dados } = servico
    setAlternando(id)
    try {
      await salvarServico({ ...dados, ativo: !servico.ativo }, id)
      avisar(
        servico.ativo
          ? `“${servico.nome}” não aparece mais para os clientes.`
          : `“${servico.nome}” voltou a aparecer para os clientes.`,
      )
      servicos.recarregar()
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível alterar o serviço.', 'erro')
    } finally {
      setAlternando(null)
    }
  }

  return (
    <div className="servicos-painel">
      <div className="agenda-barra">
        <p className="texto-apoio">
          Os serviços ativos aparecem no site e no agendamento. A duração define quanto tempo da
          agenda cada um ocupa.
        </p>
        {editando !== NOVO && (
          <button type="button" className="botao" onClick={() => setEditando(NOVO)}>
            <Plus size={18} aria-hidden="true" /> Novo serviço
          </button>
        )}
      </div>

      {editando === NOVO && (
        <FormularioServico
          titulo="Novo serviço"
          inicial={{ nome: '', descricao: '', duracaoMin: 30, ativo: true }}
          onSalvar={(dados) => salvar(dados)}
          onCancelar={() => setEditando(null)}
        />
      )}

      {servicos.carregando && <Esqueleto quantidade={3} className="lista-servicos" />}
      {servicos.erro && (
        <ErroCarregamento mensagem={servicos.erro} onTentarNovamente={servicos.recarregar} />
      )}

      {servicos.dados && (
        <ul className="lista-servicos">
          {servicos.dados.map((servico) =>
            editando === servico.id ? (
              <li key={servico.id}>
                <FormularioServico
                  titulo={`Editar ${servico.nome}`}
                  inicial={servico}
                  onSalvar={(dados) => salvar(dados, servico.id)}
                  onCancelar={() => setEditando(null)}
                />
              </li>
            ) : (
              <li key={servico.id} className={`item-servico${servico.ativo ? '' : ' item-servico--inativo'}`}>
                <div className="item-servico-corpo">
                  <div className="agendamento-topo">
                    <h3>{servico.nome}</h3>
                    <span className={`selo${servico.ativo ? ' selo--ativo' : ''}`}>
                      {servico.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p>{servico.descricao}</p>
                  <span className="opcao-meta">
                    <Clock size={14} aria-hidden="true" /> {formatarDuracao(servico.duracaoMin)}
                  </span>
                </div>
                <div className="item-servico-acoes">
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => setEditando(servico.id)}
                    aria-label={`Editar ${servico.nome}`}
                  >
                    <Pencil size={15} aria-hidden="true" /> Editar
                  </button>
                  <button
                    type="button"
                    className="botao-texto"
                    onClick={() => void alternarAtivo(servico)}
                    disabled={alternando !== null}
                    aria-busy={alternando === servico.id}
                  >
                    {alternando === servico.id && (
                      <Loader2 size={15} className="girando" aria-hidden="true" />
                    )}
                    {servico.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
