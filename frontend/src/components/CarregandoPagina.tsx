import { Loader2 } from 'lucide-react'

/** Enquanto a página espera o backend (ex.: conferir se há alguém logado). */
export default function CarregandoPagina() {
  return (
    <section className="secao">
      <div className="container pagina-estreita nao-encontrada" aria-busy="true" aria-label="Carregando">
        <Loader2 size={32} className="girando" aria-hidden="true" />
      </div>
    </section>
  )
}
