import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Tareas from './pages/Tareas'
import NuevaTarea from './pages/NuevaTarea'
import Horario from './pages/Horario'
import Entregas from './pages/Entregas'
import Alertas from './pages/Alertas'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/tareas/nueva" element={<NuevaTarea />} />
          <Route path="/horario" element={<Horario />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/alertas" element={<Alertas />} />
        </Route>
      </Route>
    </Routes>
  )
}