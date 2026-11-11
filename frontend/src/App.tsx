import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import RotaProtegida from './components/RotaProtegida.tsx'
import AuthProvider from './contexts/AuthProvider.tsx'
import AvisosProvider from './contexts/AvisosProvider.tsx'
import Agendar from './pages/Agendar.tsx'
import Cadastro from './pages/Cadastro.tsx'
import Entrar from './pages/Entrar.tsx'
import Inicio from './pages/Inicio.tsx'
import MeusAgendamentos from './pages/MeusAgendamentos.tsx'
import NaoEncontrada from './pages/NaoEncontrada.tsx'
import AgendaDoDia from './pages/painel/AgendaDoDia.tsx'
import Painel from './pages/painel/Painel.tsx'
import Relatorios from './pages/painel/Relatorios.tsx'
import Servicos from './pages/painel/Servicos.tsx'

export default function App() {
  return (
    <AvisosProvider>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="entrar" element={<Entrar />} />
            <Route path="cadastro" element={<Cadastro />} />
            <Route
              path="agendar"
              element={
                <RotaProtegida>
                  <Agendar />
                </RotaProtegida>
              }
            />
            <Route
              path="meus-agendamentos"
              element={
                <RotaProtegida>
                  <MeusAgendamentos />
                </RotaProtegida>
              }
            />
            <Route
              path="painel"
              element={
                <RotaProtegida papel="dono">
                  <Painel />
                </RotaProtegida>
              }
            >
              <Route index element={<AgendaDoDia />} />
              <Route path="servicos" element={<Servicos />} />
              <Route path="relatorios" element={<Relatorios />} />
            </Route>
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </AuthProvider>
    </AvisosProvider>
  )
}
