import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

const ERRORS = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'User already registered': 'Ya existe una cuenta con ese correo.',
  'Email not confirmed': 'Debes confirmar tu correo antes de entrar.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
}

function translate(message = '') {
  const known = Object.entries(ERRORS).find(([en]) => message.startsWith(en))
  if (known) return known[1]
  if (/rate limit/i.test(message)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  return message
}

function Field({ icon: Icon, label, right, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          {...inputProps}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        {right}
      </div>
    </label>
  )
}

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  const isRegister = mode === 'register'

  function switchMode(next) {
    setMode(next)
    setError('')
    setInfo('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const { data, error } = isRegister
      ? await signUp(email.trim(), password, fullName.trim())
      : await signIn(email.trim(), password)

    if (error) {
      setError(translate(error.message))
    } else if (isRegister && !data.session) {
      setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
        <header
          className="rounded-b-[2.5rem] px-6 pb-16 pt-[max(3rem,env(safe-area-inset-top))] text-center text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #4338ca, #6366f1)' }}
        >
          <Logo size={84} className="mx-auto drop-shadow-lg" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">UniPlan</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-indigo-100">
            Organiza tus clases, tareas y entregas en un solo lugar.
          </p>
        </header>

        <main className="-mt-8 flex-1 px-6 pb-10">
          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-indigo-100">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['login', 'Iniciar sesión'],
                ['register', 'Registrarme'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className={`rounded-lg py-2.5 text-sm font-medium transition ${
                    mode === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <Field
                  icon={User}
                  label="Nombres y Apellidos"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                />
              )}

              <Field
                icon={Mail}
                label="Correo"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@gmail.com"
              />

              <Field
                icon={Lock}
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              {info && (
                <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600">{info}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {submitting ? 'Un momento...' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Tus datos se guardan de forma segura. Nunca te pediremos tu contraseña de Blackboard.
          </p>
        </main>
      </div>
    </div>
  )
}