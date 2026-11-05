import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/** Campo de senha com botão para mostrar/ocultar o que foi digitado. */
export default function InputSenha(props: Props) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="input-senha">
      <input {...props} type={visivel ? 'text' : 'password'} />
      <button
        type="button"
        className="input-senha-botao"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
