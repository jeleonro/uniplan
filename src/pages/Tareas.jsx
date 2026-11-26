import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TaskCard from '../components/TaskCard'

const FILTERS = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'urgentes', label: 'Urgentes' },
  { id: 'completadas', label: 'Completadas' },
]

function isUrgent(task) {
  if (task.status === 'completada') return false
  const hoursLeft = (new Date(task.due_at) - new Date()) / 36e5
  return task.priority === 'alta' || hoursLeft <= 48
}

export default function Tareas() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('pendientes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, due_at, priority, status, source, course:courses(name, color)')
        .order('due_at', { ascending: true })

      if (error) setError(error.message)
      else setTasks(data)
      setLoading(false)
    }
    load()
  }, [])

  async function toggleTask(task) {
    const completing = task.status !== 'completada'
    const changes = completing
      ? { status: 'completada', completed_at: new Date().toISOString() }
      : { status: 'pendiente', completed_at: null }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...changes } : t)))

    const { error } = await supabase.from('tasks').update(changes).eq('id', task.id)
    if (error) {
      setError(error.message)
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    }
  }

  const visible = useMemo(() => {
    if (filter === 'completadas') return tasks.filter((t) => t.status === 'completada')
    if (filter === 'urgentes') return tasks.filter(isUrgent)
    return tasks.filter((t) => t.status !== 'completada')
  }, [tasks, filter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Tareas</h1>
        <Link
          to="/tareas/nueva"
          aria-label="Nueva tarea"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
        >
          <Plus size={22} />
        </Link>
      </div>

      <div className="mt-5 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-slate-400">No hay tareas aquí.</p>
        ) : (
          visible.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))
        )}
      </div>
    </div>
  )
}