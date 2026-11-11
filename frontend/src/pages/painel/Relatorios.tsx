import { BarChart3, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ErroCarregamento, Esqueleto } from '../../components/agendamento/Estados.tsx'
import { useRecurso } from '../../hooks/useRecurso.ts'
import { useTitulo } from '../../hooks/useTitulo.ts'
import { obterRelatorio } from '../../services/painelApi.ts'
import type { Relatorio } from '../../types/relatorio.ts'
import { deIso, formatarDataCurta, paraIso } from '../../utils/datas.ts'
import { formatarPreco } from '../../utils/preco.ts'

type Periodo = { inicio: string; fim: string }

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MAXIMO_DIAS = 366
const MS_DIA = 86_400_000

const diasEntre = (inicio: string, fim: string) =>
  Math.round((deIso(fim).getTime() - deIso(inicio).getTime()) / MS_DIA) + 1

/** Atalhos de período, calculados a partir de hoje. A semana começa na segunda. */
function atalhos(hoje: Date): { rotulo: string; periodo: Periodo }[] {
  const a = hoje.getFullYear()
  const m = hoje.getMonth()
  const d = hoje.getDate()
  const segunda = d - ((hoje.getDay() + 6) % 7)
  const iso = (ano: number, mes: number, dia: number) => paraIso(new Date(ano, mes, dia))
  return [
    { rotulo: 'Esta semana', periodo: { inicio: iso(a, m, segunda), fim: iso(a, m, segunda + 6) } },
    { rotulo: 'Este mês', periodo: { inicio: iso(a, m, 1), fim: iso(a, m + 1, 0) } },
    { rotulo: 'Mês passado', periodo: { inicio: iso(a, m - 1, 1), fim: iso(a, m, 0) } },
    { rotulo: 'Últimos 30 dias', periodo: { inicio: iso(a, m, d - 29), fim: iso(a, m, d) } },
    { rotulo: 'Este ano', periodo: { inicio: iso(a, 0, 1), fim: iso(a, 11, 31) } },
  ]
}

function erroDoPeriodo({ inicio, fim }: Periodo): string | null {
  if (!inicio || !fim) return 'Escolha as duas datas.'
  if (fim < inicio) return 'A data final precisa ser igual ou depois da inicial.'
  if (diasEntre(inicio, fim) > MAXIMO_DIAS) return 'Escolha um período de até 1 ano.'
  return null
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
const porcentagem = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)

export default function Relatorios() {
  useTitulo('Relatórios')
  const [opcoes] = useState(() => atalhos(new Date()))
  const [periodo, setPeriodo] = useState<Periodo>(opcoes[1].periodo)
  const erro = erroDoPeriodo(periodo)

  const relatorio = useRecurso(erro ? null : `relatorio|${periodo.inicio}|${periodo.fim}`, () =>
    obterRelatorio(periodo.inicio, periodo.fim),
  )

  return (
    <div className="relatorios">
      <div className="agenda-barra">
        <div className="atalhos-periodo" role="group" aria-label="Períodos prontos">
          {opcoes.map(({ rotulo, periodo: p }) => {
            const ativo = p.inicio === periodo.inicio && p.fim === periodo.fim
            return (
              <button
                key={rotulo}
                type="button"
                className={`chip${ativo ? ' chip--ativo' : ''}`}
                aria-pressed={ativo}
                onClick={() => setPeriodo(p)}
              >
                {rotulo}
              </button>
            )
          })}
        </div>

        <div className="periodo-campos">
          <label className="periodo-campo">
            <span>De</span>
            <input
              type="date"
              value={periodo.inicio}
              onChange={(e) => setPeriodo((p) => ({ ...p, inicio: e.target.value }))}
            />
          </label>
          <label className="periodo-campo">
            <span>Até</span>
            <input
              type="date"
              value={periodo.fim}
              onChange={(e) => setPeriodo((p) => ({ ...p, fim: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className="botao-icone"
            onClick={relatorio.recarregar}
            disabled={!!erro || relatorio.carregando || relatorio.atualizando}
            aria-label="Atualizar relatório"
            title="Atualizar relatório"
          >
            <RefreshCw size={18} className={relatorio.atualizando ? 'girando' : undefined} aria-hidden="true" />
          </button>
        </div>
      </div>

      {erro && <p className="erro-periodo" role="alert">{erro}</p>}
      {relatorio.carregando && <Esqueleto quantidade={4} className="relatorio-numeros" />}
      {relatorio.erro && (
        <ErroCarregamento mensagem={relatorio.erro} onTentarNovamente={relatorio.recarregar} />
      )}
      {!erro && relatorio.dados && <Conteudo r={relatorio.dados} />}
    </div>
  )
}

function Conteudo({ r }: { r: Relatorio }) {
  if (r.agendamentos === 0 && r.cancelados === 0) {
    return (
      <div className="vazio">
        <BarChart3 size={28} aria-hidden="true" />
        <p>Nenhum agendamento neste período.</p>
      </div>
    )
  }

  const total = r.agendamentos + r.cancelados
  const aRealizar = r.faturamentoCentavos - r.faturamentoRealizadoCentavos

  return (
    <>
      <dl className="relatorio-numeros">
        <Numero
          rotulo="Faturamento"
          valor={formatarPreco(r.faturamentoCentavos)}
          detalhe={aRealizar > 0 ? `${formatarPreco(aRealizar)} ainda por vir` : undefined}
        />
        <Numero
          rotulo="Atendimentos"
          valor={String(r.agendamentos)}
          detalhe={r.agendamentos ? `Ticket médio ${formatarPreco(r.ticketMedioCentavos)}` : undefined}
        />
        <Numero
          rotulo="Clientes"
          valor={String(r.clientes)}
          detalhe={r.clientes ? plural(r.clientesNovos, 'novo', 'novos') : undefined}
        />
        <Numero
          rotulo="Cancelamentos"
          valor={String(r.cancelados)}
          detalhe={
            r.cancelados
              ? `${porcentagem(r.cancelados, total)}% dos agendamentos · ${r.canceladosPeloCliente} pelo cliente`
              : undefined
          }
        />
      </dl>
      <p className="relatorio-nota">
        O faturamento soma os horários confirmados, com o preço de quando foram marcados. Faltas ainda
        não são descontadas.
      </p>

      {r.agendamentos > 0 && (
        <div className="relatorio-grade">
          <Bloco titulo="Movimento no período" largo>
            <Movimento dias={r.porDia} />
          </Bloco>

          <Bloco titulo="Serviços">
            <Barras
              itens={r.porServico.map((s) => ({
                rotulo: s.nome,
                valor: s.quantidade,
                detalhe: s.faturamentoCentavos ? formatarPreco(s.faturamentoCentavos) : undefined,
              }))}
            />
          </Bloco>

          <Bloco titulo="Barbeiros">
            <Barras
              itens={r.porBarbeiro.map((b) => ({
                rotulo: b.nome,
                valor: b.quantidade,
                detalhe: b.faturamentoCentavos ? formatarPreco(b.faturamentoCentavos) : undefined,
              }))}
            />
          </Bloco>

          <Bloco titulo="Dias da semana">
            <Barras
              itens={r.porDiaSemana
                .map((valor, i) => ({ rotulo: DIAS_SEMANA[i], valor }))
                .filter((d) => d.valor > 0)}
            />
          </Bloco>

          <Bloco titulo="Horários">
            <Barras itens={r.porHora.map((h) => ({ rotulo: h.hora, valor: h.quantidade }))} />
          </Bloco>

          <Bloco titulo="Clientes mais frequentes" largo>
            <ol className="lista-clientes">
              {r.clientesFrequentes.map((c) => (
                <li key={`${c.nome}|${c.telefone}`}>
                  <span>
                    <strong>{c.nome}</strong>
                    <small>{c.telefone}</small>
                  </span>
                  <span className="lista-clientes-qtd">{plural(c.quantidade, 'visita', 'visitas')}</span>
                </li>
              ))}
            </ol>
          </Bloco>
        </div>
      )}
    </>
  )
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="relatorio-numero">
      <dt>{rotulo}</dt>
      <dd>
        <strong>{valor}</strong>
        {detalhe && <span>{detalhe}</span>}
      </dd>
    </div>
  )
}

function Bloco({ titulo, largo, children }: { titulo: string; largo?: boolean; children: ReactNode }) {
  return (
    <section className={`relatorio-bloco${largo ? ' relatorio-bloco--largo' : ''}`} aria-label={titulo}>
      <h3>{titulo}</h3>
      {children}
    </section>
  )
}

type ItemBarra = { rotulo: string; valor: number; detalhe?: string }

/** Lista com barras horizontais: o tamanho de cada barra é relativo ao maior valor. */
function Barras({ itens }: { itens: ItemBarra[] }) {
  const maior = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <ul className="barras">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="barras-texto">
            <span>{i.rotulo}</span>
            <span>
              <strong>{i.valor}</strong>
              {i.detalhe && <small> · {i.detalhe}</small>}
            </span>
          </div>
          <div className="barras-trilho" aria-hidden="true">
            <div className="barras-valor" style={{ width: `${(i.valor / maior) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })

/** Colunas por dia; períodos longos (mais de 2 meses) são somados por mês. */
function Movimento({ dias }: { dias: Relatorio['porDia'] }) {
  const porMes = dias.length > 62
  const colunas = porMes
    ? Object.values(
        dias.reduce<Record<string, { rotulo: string; titulo: string; valor: number }>>((acc, d) => {
          const chave = d.data.slice(0, 7)
          const rotulo = mesAno.format(deIso(d.data)).replace('. de ', '/').replace('.', '')
          acc[chave] ??= { rotulo, titulo: rotulo, valor: 0 }
          acc[chave].valor += d.quantidade
          return acc
        }, {}),
      )
    : dias.map((d) => ({
        rotulo: String(deIso(d.data).getDate()),
        titulo: formatarDataCurta(d.data),
        valor: d.quantidade,
      }))

  const maior = Math.max(1, ...colunas.map((c) => c.valor))
  const pico = colunas.reduce((a, b) => (b.valor > a.valor ? b : a))
  // Com muitas colunas, os rótulos de baixo ficam espaçados para não encavalar.
  const passo = Math.ceil(colunas.length / 16)

  return (
    <figure className="movimento">
      <div
        className="movimento-colunas"
        role="img"
        aria-label={`Atendimentos por ${porMes ? 'mês' : 'dia'}. Maior movimento: ${pico.titulo}, com ${pico.valor}.`}
      >
        {colunas.map((c, i) => (
          <div key={i} className="movimento-coluna" title={`${c.titulo}: ${plural(c.valor, 'atendimento', 'atendimentos')}`}>
            <div className="movimento-barra" style={{ height: `${(c.valor / maior) * 100}%` }} />
            <span className="movimento-rotulo">{i % passo === 0 ? c.rotulo : ''}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}
