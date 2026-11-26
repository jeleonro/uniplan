import { supabase } from '../lib/supabase'
import { BB_HOST, SOURCE } from '../lib/blackboard/types'
import { mapIcsToBundle } from '../lib/blackboard/mapper'
import { getDemoBundle } from '../lib/blackboard/demoData'

export function assertBlackboardUrl(value) {
  let url
  try {
    url = new URL(String(value).trim())
  } catch {
    throw new Error('El enlace no es válido.')
  }
  if (url.protocol !== 'https:' || url.hostname !== BB_HOST) {
    throw new Error(`El enlace debe ser de https://${BB_HOST}`)
  }
  return url.toString()
}

export async function getConnection() {
  const { data, error } = await supabase
    .from('blackboard_connections')
    .select('mode, last_synced_at')
    .maybeSingle()
  if (error) throw error
  return data
}

async function getIcsUrl() {
  const { data, error } = await supabase
    .from('blackboard_connections')
    .select('ics_url')
    .maybeSingle()
  if (error) throw error
  return data?.ics_url
}

async function fetchIcsText(url) {
  const res = await fetch('/api/ics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (res.status === 404) {
    throw new Error(
      'La sincronización por enlace solo funciona en la app desplegada en Vercel. En local usa el archivo .ics o el modo demo.'
    )
  }
  if (!res.ok) {
    let message = `No se pudo leer el calendario (${res.status}).`
    try {
      message = (await res.json()).error ?? message
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message)
  }
  return res.text()
}

function bundleFromIcsText(text) {
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('El contenido no parece un calendario .ics válido.')
  }
  return mapIcsToBundle(text)
}

// Guarda el bundle en Supabase. No toca el avance del estudiante: al actualizar tareas
// existentes solo se escriben título, fecha, curso y prioridad (nunca status ni completed_at).
async function persistBundle(userId, bundle) {
  const source = SOURCE.BLACKBOARD
  if (bundle.courses.length + bundle.tasks.length + bundle.sessions.length === 0) {
    throw new Error('No se encontraron clases ni entregas en ese calendario.')
  }

  // 1. Cursos
  let courseIds = new Map()
  if (bundle.courses.length > 0) {
    const { data, error } = await supabase
      .from('courses')
      .upsert(
        bundle.courses.map((c) => ({
          user_id: userId,
          external_id: c.externalId,
          source,
          name: c.name,
          section: c.section,
          color: c.color,
        })),
        { onConflict: 'user_id,external_id' }
      )
      .select('id, external_id')
    if (error) throw error
    courseIds = new Map(data.map((c) => [c.external_id, c.id]))
  }

  // 2. Tareas / entregas
  if (bundle.tasks.length > 0) {
    const { error } = await supabase.from('tasks').upsert(
      bundle.tasks.map((t) => ({
        user_id: userId,
        external_id: t.externalId,
        source,
        course_id: courseIds.get(t.courseExternalId) ?? null,
        title: t.title,
        due_at: t.dueAt,
        priority: t.priority,
      })),
      { onConflict: 'user_id,external_id' }
    )
    if (error) throw error
  }

  // 3. Horario: el horario de Blackboard es una foto completa, así que se limpian las clases que ya no existen
  const sessions = bundle.sessions.filter((s) => courseIds.has(s.courseExternalId))
  if (sessions.length > 0) {
    const { error } = await supabase.from('class_sessions').upsert(
      sessions.map((s) => ({
        user_id: userId,
        external_id: s.externalId,
        source,
        course_id: courseIds.get(s.courseExternalId),
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        location: s.location,
        meeting_url: s.meetingUrl,
      })),
      { onConflict: 'user_id,external_id' }
    )
    if (error) throw error
  }

  const { data: existing, error: listError } = await supabase
    .from('class_sessions')
    .select('id, external_id')
    .eq('source', source)
  if (listError) throw listError

  const keep = new Set(sessions.map((s) => s.externalId))
  const staleIds = existing.filter((s) => !keep.has(s.external_id)).map((s) => s.id)
  if (staleIds.length > 0) {
    const { error } = await supabase.from('class_sessions').delete().in('id', staleIds)
    if (error) throw error
  }

  return { courses: bundle.courses.length, tasks: bundle.tasks.length, sessions: sessions.length }
}

async function runImport(userId, mode, icsUrl, bundle) {
  const counts = await persistBundle(userId, bundle)
  const { error } = await supabase.from('blackboard_connections').upsert(
    {
      user_id: userId,
      mode,
      ics_url: icsUrl,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw error
  return counts
}

export async function connectWithIcsUrl(userId, url) {
  const clean = assertBlackboardUrl(url)
  const bundle = bundleFromIcsText(await fetchIcsText(clean))
  return runImport(userId, 'ics', clean, bundle)
}

export async function importIcsFile(userId, file) {
  const bundle = bundleFromIcsText(await file.text())
  return runImport(userId, 'file', null, bundle)
}

export async function connectDemo(userId) {
  return runImport(userId, 'demo', null, getDemoBundle())
}

export async function syncNow(userId, connection) {
  if (connection.mode === 'demo') return connectDemo(userId)
  if (connection.mode === 'ics') {
    const url = await getIcsUrl()
    if (!url) throw new Error('No se encontró el enlace guardado. Desconecta y vuelve a conectar.')
    return connectWithIcsUrl(userId, url)
  }
  throw new Error('Esta conexión se hizo con un archivo: importa el .ics actualizado.')
}

export async function disconnect(userId, { removeData }) {
  if (removeData) {
    for (const table of ['tasks', 'class_sessions', 'courses']) {
      const { error } = await supabase.from(table).delete().eq('source', SOURCE.BLACKBOARD)
      if (error) throw error
    }
  }
  const { error } = await supabase.from('blackboard_connections').delete().eq('user_id', userId)
  if (error) throw error
}