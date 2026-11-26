import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Bell, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildAlertCandidates, buildTipText } from '../services/smartAlertsService'
import SyncBadge from '../components/SyncBadge'

const TYPE_LABEL = {
  alerta: 'Alerta de entrega',
  sugerencia: 'Sugerencia',
  recordatorio: 'Recordatorio',
}

const TYPE_ORDER = { alerta: 0, sugerencia: 1, recordatorio: 2 }

const byType = (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]

export default function Alertas() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [tipText, setTipText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [tasksRes, sessionsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, due_at')
          .neq('status', 'completada')
          .order('due_at', { ascending: true }),
        supabase
          .from('class_sessions')
          .select('day_of_week, start_time, end_time, location, course:courses(name)'),
      ])

      if (tasksRes.error || sessionsRes.error) {
        setError((tasksRes.error || sessionsRes.error).message)
        setLoading(false)
        return
      }

      const tasks = tasksRes.data
      const sessions = sessionsRes.data

      setTipText(buildTipText(tasks, sessions))

      const candidates = buildAlertCandidates(user.id, tasks, sessions)
      if (candidates.length > 0) {
        const { error: upsertError } = await supabase
          .from('alerts')
          .upsert(candidates, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
        if (upsertError) setError(upsertError.message)
      }

      const { data, error: alertsError } = await supabase
        .from('alerts')
        .select('id, type, message, created_at, task:tasks(status, source)')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (alertsError) {
        setError(alertsError.message)
      } else {
        setAlerts(data.filter((a) => a.task?.status !== 'completada').sort(byType))
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  async function dismiss(alert) {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
    const { error } = await supabase.from('alerts').update({ is_read: true }).eq('id', alert.id)
    if (error) {
      setError(error.message)
      setAlerts((prev) => [...prev, alert].sort(byType))
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Alertas</h1>

      <div className="mt-5 rounded-2xl bg-indigo-50 p-4">
        <div className="flex items-center gap-2 font-semibold text-indigo-600">
          <Sparkles size={18} />
          Consejos Inteligentes de Organización
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {tipText || 'Analizando tus fechas límite y tu horario...'}
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : alerts.length === 0 ? (
          <p className="py-10 text-center text-slate-400">No tienes alertas nuevas.</p>
        ) : (
          alerts.map((a) => {
            const isAlert = a.type === 'alerta'
            const Icon = isAlert ? AlertCircle : Bell

            return (
              <div
                key={a.id}
                className={`rounded-2xl border bg-white p-4 ${
                  isAlert ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 text-xs font-bold uppercase ${
                      isAlert ? 'text-red-600' : 'text-indigo-600'
                    }`}
                  >
                    <Icon size={16} />
                    {TYPE_LABEL[a.type]}
                  </div>
                  <SyncBadge source={a.task?.source} />
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-700">{a.message}</p>

                <div className="mt-3 flex justify-end">
                  {isAlert ? (
                    <Link
                      to="/tareas"
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600"
                    >
                      Resolver Ahora
                    </Link>
                  ) : (
                    <button
                      onClick={() => dismiss(a)}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600"
                    >
                      Entendido
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}