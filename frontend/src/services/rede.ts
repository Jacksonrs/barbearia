/** Atraso simulado de rede para os dados de exemplo (zerado nos testes). */
const ATRASO_MS = import.meta.env.MODE === 'test' ? 0 : 400

export const esperar = () => new Promise((resolver) => setTimeout(resolver, ATRASO_MS))
