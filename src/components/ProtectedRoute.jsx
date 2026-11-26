import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

    if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Logo size={72} className="animate-pulse" />
        <p className="text-sm font-medium text-slate-400">Cargando UniPlan...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}