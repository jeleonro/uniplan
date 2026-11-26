import { BB_TIMEZONE } from './types.js'

const PALETTE = ['indigo', 'blue', 'orange', 'green', 'rose', 'amber']
const BYDAY = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 }
const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const BB_CALENDAR_ENTRY = 'blackboard.data.calendar.CalendarEntry'
const COURSE_LABEL = /\d+\s*:\s*\d{6}-[^\n,;)]+/
const IS_COURSE_LABEL = /^\s*(\d+\s*:\s*)?\d{6}-/

/* ---------- Nombres de curso ---------- */

// "806212447: 202602-COMPUTACIÓN III-311T1" -> { name: "COMPUTACIÓN III", section: "311T1", term: "202602" }
export function cleanCourseLabel(raw = '') {
  const text = String(raw).trim()
  const m = text.match(/^(?:(\d+)\s*:\s*)?(\d{6})-(?:[A-Za-z]-)?(.+?)(?:-([A-Za-z0-9]+))?\s*$/)
  if (!m) return { name: text, section: null, term: null }
  return { name: m[3].trim(), section: m[4] ?? null, term: m[2] }
}

/* ---------- Colores ---------- */

// Convierte el color hex de Blackboard a la clave de paleta más cercana por tono
export function paletteFromHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!m) return 'indigo'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d < 0.08) return 'indigo'

  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = (h * 60 + 360) % 360

  if (h < 20 || h >= 340) return 'rose'
  if (h < 45) return 'orange'
  if (h < 70) return 'amber'
  if (h < 170) return 'green'
  if (h < 255) return 'blue'
  return 'indigo'
}

export function paletteFromName(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/* ---------- Fechas y prioridad ---------- */

const limaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BB_TIMEZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Instante UTC -> día de la semana (1 = lunes) y hora "HH:MM" en Lima
export function toLimaParts(input) {
  const parts = Object.fromEntries(
    limaFormatter.formatToParts(new Date(input)).map((p) => [p.type, p.value])
  )
  return { dayOfWeek: WEEKDAYS[parts.weekday], time: `${parts.hour}:${parts.minute}` }
}

// Alta: vence en < 24 h o ya venció. Media: 1 a 3 días. Baja: más de 3 días.
export function priorityFor(dueIso, now = new Date()) {
  const hours = (new Date(dueIso) - now) / 36e5
  if (hours < 24) return 'alta'
  if (hours <= 72) return 'media'
  return 'baja'
}

/* ---------- Ubicación / Zoom ---------- */

export function parseLocation(location) {
  const loc = (location ?? '').trim()
  if (/^https?:\/\//i.test(loc)) {
    let label = 'Aula Virtual'
    if (/zoom\.us/i.test(loc)) label = 'Aula Virtual Zoom'
    else if (/meet\.google\.com/i.test(loc)) label = 'Aula Virtual Meet'
    else if (/teams\.microsoft\.com/i.test(loc)) label = 'Aula Virtual Teams'
    return { location: label, meetingUrl: loc }
  }
  return { location: loc || null, meetingUrl: null }
}

/* ---------- Utilidades de bundle ---------- */

export function dedupeByExternalId(items) {
  const map = new Map()
  for (const item of items) map.set(item.externalId, item)
  return [...map.values()]
}

export function normalizeBundle({ courses = [], tasks = [], sessions = [] }) {
  return {
    courses: dedupeByExternalId(courses),
    tasks: dedupeByExternalId(tasks),
    sessions: dedupeByExternalId(sessions),
  }
}

/* ---------- Mappers de la API REST (esquemas reales de Blackboard Ultra) ---------- */

// GET /learn/api/v1/calendars?limit=10000
export function mapCourses(json) {
  return (json?.results ?? [])
    .filter((c) => c.id && c.labelLocalizable?.rawValue)
    .map((c) => {
      const { name, section, term } = cleanCourseLabel(c.labelLocalizable.rawValue)
      return { externalId: c.id, name, section, term, color: paletteFromHex(c.color) }
    })
}

// GET /learn/api/v1/calendars/todo/studentItems?since=...&until=...
export function mapStudentItems(json, now = new Date()) {
  const items = [
    ...(json?.overdueItems ?? []),
    ...(json?.dueTodayItems ?? []),
    ...(json?.futureDueItems ?? []),
  ]
  return items
    .filter(
      (i) =>
        i.title &&
        i.dueDate &&
        i.column?.visible !== false &&
        (!i.contentVisibility || i.contentVisibility === 'VISIBLE')
    )
    .map((i) => ({
      externalId: `${i.column?.courseId ?? 'sin-curso'}|${i.title}`,
      courseExternalId: i.column?.courseId ?? null,
      title: i.title,
      dueAt: new Date(i.dueDate).toISOString(),
      priority: priorityFor(i.dueDate, now),
    }))
}

// GET /learn/api/v1/calendars/calendarItems?since=...&until=...
// Solo CalendarEntry con recurrencia semanal (las GradableItem ya llegan por studentItems)
export function mapCalendarItems(json) {
  const sessions = []
  const courses = []

  for (const item of json?.results ?? []) {
    if (item.itemSourceType !== BB_CALENDAR_ENTRY) continue
    const days = (item.recurRules?.byWeekDay ?? []).map((d) => BYDAY[d]).filter(Boolean)
    if (days.length === 0) continue

    const { name, section, term } = cleanCourseLabel(item.title)
    courses.push({ externalId: item.calendarId, name, section, term, color: paletteFromName(name) })

    const start = toLimaParts(item.startDate).time
    const end = toLimaParts(item.endDate).time
    const place = parseLocation(item.location)

    for (const dayOfWeek of days) {
      sessions.push({
        externalId: `${item.itemSourceId}:${dayOfWeek}`,
        courseExternalId: item.calendarId,
        dayOfWeek,
        startTime: start,
        endTime: end,
        ...place,
      })
    }
  }
  return { sessions, courses }
}

export function buildBundleFromRest({ calendars, studentItems, calendarItems }, now = new Date()) {
  const catalog = mapCourses(calendars)
  const { sessions, courses: fromEntries } = mapCalendarItems(calendarItems)
  return normalizeBundle({
    // El catálogo va al final para que sus nombres y colores tengan prioridad
    courses: [...fromEntries, ...catalog],
    tasks: mapStudentItems(studentItems, now),
    sessions,
  })
}

/* ---------- Parser de calendario .ics ---------- */

const unfold = (text) => text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '')
const unescapeText = (v = '') => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1')

// 20261119T045900Z (UTC) | 20261119T235900 (sin zona: se asume Lima, UTC-5 sin horario de verano)
export function parseIcsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/.exec(String(value).trim())
  if (!m) return null
  const [, y, mo, d, h = '0', mi = '0', s = '0', z] = m
  const utc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)
  return new Date(z ? utc : utc + 5 * 3600 * 1000)
}

export function parseIcs(text) {
  const events = []
  let current = null
  for (const raw of unfold(String(text)).split('\n')) {
    const line = raw.trimEnd()
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
      continue
    }
    if (!current) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const name = line.slice(0, idx).split(';')[0].toUpperCase()
    current[name] = line.slice(idx + 1)
  }
  return events
}

const parseRrule = (v) => Object.fromEntries(v.split(';').map((p) => p.split('=')))

// Clases = eventos con recurrencia semanal. Entregas = el resto de eventos con fecha reciente o futura.
export function mapIcsToBundle(text, now = new Date()) {
  const courses = new Map()
  const tasks = []
  const sessions = []
  const oldest = now.getTime() - 14 * 864e5

  const ensureCourse = (label) => {
    const { name, section, term } = cleanCourseLabel(label)
    const externalId = `ics:${name}|${section ?? ''}`
    if (!courses.has(externalId)) {
      courses.set(externalId, { externalId, name, section, term, color: paletteFromName(name) })
    }
    return externalId
  }

  for (const ev of parseIcs(text)) {
    const summary = unescapeText(ev.SUMMARY ?? '').trim()
    const start = ev.DTSTART ? parseIcsDate(ev.DTSTART) : null
    if (!ev.UID || !summary || !start) continue

    const rrule = ev.RRULE ? parseRrule(ev.RRULE) : null

    if (rrule?.FREQ === 'WEEKLY' && rrule.BYDAY) {
      const until = rrule.UNTIL ? parseIcsDate(rrule.UNTIL) : null
      if (until && until < now) continue

      const end = ev.DTEND ? parseIcsDate(ev.DTEND) : new Date(start.getTime() + 90 * 60000)
      const place = parseLocation(unescapeText(ev.LOCATION ?? ''))
      const courseExternalId = ensureCourse(summary)
      const startTime = toLimaParts(start).time
      const endTime = toLimaParts(end).time

      for (const code of rrule.BYDAY.split(',')) {
        const dayOfWeek = BYDAY[code.replace(/[^A-Z]/g, '')]
        if (!dayOfWeek) continue
        sessions.push({
          externalId: `${ev.UID}:${dayOfWeek}`,
          courseExternalId,
          dayOfWeek,
          startTime,
          endTime,
          ...place,
        })
      }
      continue
    }

    // Ocurrencia suelta de una clase: no entra al horario semanal
    if (IS_COURSE_LABEL.test(summary)) continue
    if (start.getTime() < oldest) continue

    const haystack = [ev.CATEGORIES, ev.DESCRIPTION, ev.SUMMARY, ev.LOCATION]
      .map((v) => unescapeText(v ?? ''))
      .join('\n')
    const label = haystack.match(COURSE_LABEL)?.[0]
    const courseExternalId = label ? ensureCourse(label) : null

    tasks.push({
      externalId: `ics:${ev.UID}`,
      courseExternalId,
      title: summary,
      dueAt: start.toISOString(),
      priority: priorityFor(start, now),
    })
  }

  return normalizeBundle({ courses: [...courses.values()], tasks, sessions })
}