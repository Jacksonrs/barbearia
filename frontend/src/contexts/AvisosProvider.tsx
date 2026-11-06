import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AvisosContext, type Aviso, type TipoAviso } from './avisos.ts'

const DURACAO_MS = 4500
const MAXIMO_NA_TELA = 3

const icones = { sucesso: CircleCheck, erro: CircleAlert, info: Info }

function ItemAviso({ aviso, onFechar }: { aviso: Aviso; onFechar: (id: number) => void }) {
  const Icone = icones[aviso.tipo]
  // Pausa o tempo enquanto o mouse está em cima, para dar tempo de ler.
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    const temporizador = setTimeout(() => onFechar(aviso.id), DURACAO_MS)
    return () => clearTimeout(temporizador)
  }, [pausado, aviso.id, onFechar])

  return (
    <li
      className={`aviso aviso--${aviso.tipo}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <Icone size={20} className="aviso-icone" aria-hidden="true" />
      <p>{aviso.texto}</p>
      <button type="button" className="aviso-fechar" onClick={() => onFechar(aviso.id)} aria-label="Fechar aviso">
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  )
}

export default function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const proximoId = useRef(0)

  const avisar = useCallback((texto: string, tipo: TipoAviso = 'sucesso') => {
    const id = ++proximoId.current
    setAvisos((lista) => [...lista, { id, texto, tipo }].slice(-MAXIMO_NA_TELA))
  }, [])

  const fechar = useCallback((id: number) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id))
  }, [])

  return (
    <AvisosContext value={avisar}>
      {children}
      {/* Sempre no DOM: leitores de tela só anunciam mudanças em regiões que já existiam. */}
      <ol className="avisos" aria-live="polite" aria-label="Avisos">
        {avisos.map((aviso) => (
          <ItemAviso key={aviso.id} aviso={aviso} onFechar={fechar} />
        ))}
      </ol>
    </AvisosContext>
  )
}
