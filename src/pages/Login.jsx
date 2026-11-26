import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  const isRegister = mode === 'register'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const { data, error } = isRegister
      ? await signUp(email, password, fullName)
      : await signIn(email, password)

    if (error) {
      setError(error.message)
    } else if (isRegister && !data.session) {
      setInfo('Revisa tu correo para confirmar tu cuenta.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-900">UniPlan</h1>
        <p className="mt-1 text-slate-500">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-indigo-600">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Cargando...' : isRegister ? 'Registrarme' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(isRegister ? 'login' : 'register')
            setError('')
            setInfo('')
          }}
          className="mt-6 w-full text-center text-sm text-indigo-600"
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  )
}