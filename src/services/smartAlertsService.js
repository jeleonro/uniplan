const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_START = 8 * 60
const DAY_END = 20 * 60

const pad = (n) => String(n).padStart(2, '0')
const fmt = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const toMin = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dayId = (d) => (d.getDay() === 0 ? 7 : d.getDay())

// Minutos desde medianoche, redondeados hacia arriba a la media hora siguiente
function nowRounded(now) {
  return Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30
}

// Bloques libres de un día entre 08:00 y 20:00 (mínimo 60 min), restando las clases
export function freeSlots(sessions, day, { from = DAY_START, to = DAY_END, minLength = 60 } = {}) {
  const busy = sessions
    .filter((s) => s.day_of_week === day)
    .map((s) => [toMin(s.start_time), toMin(s.end_time)])
    .sort((a, b) => a[0] - b[0])

  const slots = []
  let cursor = from
  for (const [start, end] of busy) {
    if (Math.min(start, to) - cursor >= minLength) slots.push({ start: cursor, end: Math.min(start, to) })
    cursor = Math.max(cursor, end)
  }
  if (to - cursor >= minLength) slots.push({ start: cursor, end: to })
  return slots
}

// Candidatos a alerta. Cada uno lleva dedupe_key para no repetirse al volver a abrir la pantalla.
export function buildAlertCandidates(userId, tasks, sessions, now = new Date()) {
  const rows = []

  // 1. Alerta de entrega: vence en menos de 12 horas
  for (const t of tasks) {
    const hours = (new Date(t.due_at) - now) / 36e5
    if (hours > 0 && hours <= 12) {
      rows.push({
        user_id: userId,
        task_id: t.id,
        type: 'alerta',
        message: `Faltan menos de 12 horas para: ${t.title}.`,
        dedupe_key: `due12:${t.id}`,
      })
    }
  }

  // 2. Recordatorio: primera clase de mañana
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const first = sessions
    .filter((s) => s.day_of_week === dayId(tomorrow))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

  if (first) {
    const place = first.location ? ` en ${first.location}` : ''
    rows.push({
      user_id: userId,
      type: 'recordatorio',
      message: `Mañana tienes clase de ${first.course?.name} a primera hora (${first.start_time.slice(0, 5)})${place}.`,
      dedupe_key: `reminder:${dateKey(tomorrow)}`,
    })
  }

  // 3. Sugerencia: cruza la entrega más próxima (> 12 h) con el primer bloque libre de hoy o mañana
  const nextTask = tasks
    .filter((t) => {
      const hours = (new Date(t.due_at) - now) / 36e5
      return hours > 12 && hours <= 24 * 7
    })
    .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))[0]

  if (nextTask) {
    let slot = freeSlots(sessions, dayId(now), { from: Math.max(DAY_START, nowRounded(now)) })[0]
    let when = 'hoy'
    if (!slot) {
      slot = freeSlots(sessions, dayId(tomorrow))[0]
      when = 'mañana'
    }
    if (slot) {
      rows.push({
        user_id: userId,
        type: 'sugerencia',
        message: `Tienes un bloque libre ${when} de ${fmt(slot.start)} a ${fmt(slot.end)}. Buen momento para avanzar con: ${nextTask.title}.`,
        dedupe_key: `tip:${dateKey(now)}`,
      })
    }
  }

  return rows
}

// Texto de la tarjeta "Consejos Inteligentes": busca el día más libre de los próximos 3 días
export function buildTipText(tasks, sessions, now = new Date()) {
  const upcoming = tasks
    .filter((t) => {
      const days = (new Date(t.due_at) - now) / 864e5
      return days > 0 && days <= 7
    })
    .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))

  if (upcoming.length === 0) {
    return 'No tienes entregas en los próximos 7 días. Buen momento para adelantar trabajo o descansar.'
  }

  let best = null
  for (let i = 0; i < 3; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const from = i === 0 ? Math.max(DAY_START, nowRounded(now)) : DAY_START
    const minutes = freeSlots(sessions, dayId(d), { from }).reduce((n, s) => n + (s.end - s.start), 0)
    if (!best || minutes > best.minutes) best = { id: dayId(d), minutes, offset: i }
  }

  const label =
    best.offset === 0 ? 'hoy' : best.offset === 1 ? 'mañana' : DAY_NAMES[best.id].toLowerCase()
  const count = upcoming.length
  return `Tienes ${count} ${count === 1 ? 'entrega' : 'entregas'} en los próximos 7 días. Tu día más libre es ${label} (${Math.round(best.minutes / 60)} h libres): úsalo para avanzar con "${upcoming[0].title}" y no saturar tu horario.`
}