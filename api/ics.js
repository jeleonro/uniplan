const ALLOWED_HOSTS = ['ucv.blackboard.com']
const MAX_CHARS = 5 * 1024 * 1024

// Proxy mínimo: el navegador no puede leer el .ics de Blackboard directamente (CORS).
// Solo acepta enlaces https de hosts permitidos y no registra la URL (es un enlace privado).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  let target
  try {
    target = new URL(req.body?.url)
  } catch {
    return res.status(400).json({ error: 'El enlace no es válido.' })
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.includes(target.hostname)) {
    return res.status(400).json({ error: 'Solo se permiten enlaces de ucv.blackboard.com.' })
  }

  try {
    const upstream = await fetch(target, {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'text/calendar' },
    })
    if (!upstream.ok) {
      return res.status(502).json({ error: `Blackboard respondió ${upstream.status}. Revisa que el enlace siga vigente.` })
    }

    const text = await upstream.text()
    if (text.length > MAX_CHARS) {
      return res.status(413).json({ error: 'El calendario es demasiado grande.' })
    }
    if (!text.includes('BEGIN:VCALENDAR')) {
      return res.status(422).json({ error: 'La respuesta no es un calendario .ics.' })
    }

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    return res.status(200).send(text)
  } catch {
    return res.status(502).json({ error: 'No se pudo contactar a Blackboard.' })
  }
}