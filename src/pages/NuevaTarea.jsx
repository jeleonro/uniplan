import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const PRIORITIES = [
  { id: 'baja', label: 'Baja' },
  { id: 'media', label: 'Media' },
  { id: 'alta', label: 'Alta' },
]

const pad = (n) => String(n).padStart(2, '0')

// Mañana a las 23:59, en el formato que espera <input type="datetime-local">
function defaultDue() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500'

export default function NuevaTarea() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [dueAt, setDueAt] = useState(defaultDue())
  const [priority, setPriority] = useState('media')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCourses(data ?? []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Escribe el nombre de la tarea.')
      return
    }
    if (!dueAt) {
      setError('Elige la fecha y hora de entrega.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      course_id: courseId || null,
      due_at: new Date(dueAt).toISOString(),
      priority,
      notes: notes.trim() || null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    navigate('/tareas')
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="text-slate-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Nueva Tarea</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre de la tarea <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Investigación Métodos Cuantitativos"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Asignatura
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin asignatura</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Fecha y Hora de Entrega <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Nivel de Prioridad
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-indigo-50 p-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`rounded-lg py-2.5 text-sm font-medium transition ${
                  priority === p.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notas / Detalles
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Incluir fuentes bibliográficas en formato APA."
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Plus size={20} />
          {saving ? 'Guardando...' : 'Guardar Tarea'}
        </button>
      </form>
    </div>
  )
}