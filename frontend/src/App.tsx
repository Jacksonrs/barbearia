import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Agendar from './pages/Agendar.tsx'
import Inicio from './pages/Inicio.tsx'
import NaoEncontrada from './pages/NaoEncontrada.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="agendar" element={<Agendar />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
