import { CalendarDays, CalendarX } from 'lucide-react'
import { useMemo } from 'react'
import { useRecurso } from '../../hooks/useRecurso.ts'
import { diaAberto, listarHorarios } from '../../services/agendamentoApi.ts'
import type { Horario } from '../../types/agendamento.ts'
import {
  formatarDataLonga,
  formatarDiaSemanaCurto,
  formatarMesCurto,
  paraIso,
  proximosDias,
} from '../../utils/datas.ts'
import { ErroCarregamento, Esqueleto } from './Estados.tsx'

const DIAS_VISIVEIS = 14

type Props = {
  servicoId: string
  barbeiroId: string
  data: string | null
  hora: string | null
  onData: (data: string) => void
  onHora: (hora: string) => void
}

function agrupar(horarios: Horario[]) {
  return [
    { nome: 'Manhã', itens: horarios.filter((h) => h.hora < '12:00') },
    { nome: 'Tarde', itens: horarios.filter((h) => h.hora >= '12:00' && h.hora < '18:00') },
    { nome: 'Noite', itens: horarios.filter((h) => h.hora >= '18:00') },
  ].filter((grupo) => grupo.itens.length > 0)
}

export default function EtapaHorario({ servicoId, barbeiroId, data, hora, onData, onHora }: Props) {
  const dias = useMemo(() => proximosDias(DIAS_VISIVEIS), [])
  const hoje = paraIso(dias[0])

  const horarios = useRecurso(data ? `${data}|${servicoId}|${barbeiroId}` : null, () =>
    listarHorarios(data ?? '', servicoId, barbeiroId),
  )

  const livres = horarios.dados?.filter((h) => h.disponivel).length ?? 0

  return (
    <div className="horario">
      <fieldset className="grupo">
        <legend className="grupo-titulo">Dia</legend>
        <div className="dias">
          {dias.map((dia) => {
            const iso = paraIso(dia)
            const aberto = diaAberto(dia)
            return (
              <label key={iso} className={`dia${aberto ? '' : ' dia--fechado'}`}>
                <input
                  type="radio"
                  name="data"
                  className="visualmente-oculto"
                  checked={data === iso}
                  disabled={!aberto}
                  onChange={() => onData(iso)}
                  aria-label={`${formatarDataLonga(iso)}${aberto ? '' : ' (fechado)'}`}
                />
                <span className="dia-semana">{iso === hoje ? 'Hoje' : formatarDiaSemanaCurto(dia)}</span>
                <span className="dia-numero">{dia.getDate()}</span>
                <span className="dia-mes">{aberto ? formatarMesCurto(dia) : 'Fechado'}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo-titulo">
          Horário
          {horarios.dados && livres > 0 && (
            <span className="grupo-contador">
              {livres} {livres === 1 ? 'livre' : 'livres'}
            </span>
          )}
        </legend>

        {!data && (
          <div className="vazio">
            <CalendarDays size={28} aria-hidden="true" />
            <p>Escolha um dia para ver os horários livres.</p>
          </div>
        )}

        {horarios.carregando && <Esqueleto quantidade={12} className="horas" />}

        {horarios.erro && (
          <ErroCarregamento mensagem={horarios.erro} onTentarNovamente={horarios.recarregar} />
        )}

        {horarios.dados && livres === 0 && (
          <div className="vazio">
            <CalendarX size={28} aria-hidden="true" />
            <p>Nenhum horário livre neste dia. Tente outro dia ou outro barbeiro.</p>
          </div>
        )}

        {horarios.dados &&
          livres > 0 &&
          agrupar(horarios.dados).map((grupo) => (
            <div key={grupo.nome} className="periodo">
              <span className="periodo-nome">{grupo.nome}</span>
              <div className="horas">
                {grupo.itens.map((h) => (
                  <label key={h.hora} className="hora">
                    <input
                      type="radio"
                      name="hora"
                      className="visualmente-oculto"
                      checked={hora === h.hora}
                      disabled={!h.disponivel}
                      onChange={() => onHora(h.hora)}
                      aria-label={h.disponivel ? h.hora : `${h.hora} (ocupado)`}
                    />
                    {h.hora}
                  </label>
                ))}
              </div>
            </div>
          ))}
      </fieldset>
    </div>
  )
}
