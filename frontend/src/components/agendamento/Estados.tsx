import { AlertCircle, RotateCcw } from 'lucide-react'

export function Esqueleto({ quantidade, className }: { quantidade: number; className: string }) {
  return (
    <div className={className} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="esqueleto" />
      ))}
    </div>
  )
}

export function ErroCarregamento({
  mensagem,
  onTentarNovamente,
}: {
  mensagem: string
  onTentarNovamente: () => void
}) {
  return (
    <div className="alerta alerta--erro" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <p>{mensagem}</p>
      <button type="button" className="botao-texto" onClick={onTentarNovamente}>
        <RotateCcw size={15} aria-hidden="true" /> Tentar novamente
      </button>
    </div>
  )
}
