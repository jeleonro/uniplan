import { BB_HOST } from './types.js'
import { buildBundleFromRest } from './mapper.js'

/**
 * Adaptador REST de Blackboard Ultra (preparado, todavía sin activar en la UI).
 *
 * Para usarlo hace falta que la UCV registre una aplicación OAuth 2.0 (3-legged) para UniPlan.
 * El intercambio de código por token debe hacerse en un backend (por ejemplo, una función en /api),
 * porque el client secret nunca debe llegar al navegador. Este adaptador solo recibe una función
 * `getAccessToken` que entrega un token vigente; no guarda credenciales.
 */
export class BlackboardRestAdapter {
  constructor({ baseUrl = `https://${BB_HOST}`, getAccessToken }) {
    this.baseUrl = baseUrl
    this.getAccessToken = getAccessToken
  }

  async get(path) {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Blackboard respondió ${res.status} en ${path.split('?')[0]}`)
    return res.json()
  }

  getCalendars() {
    return this.get('/learn/api/v1/calendars?limit=10000')
  }

  getStudentItems(since, until) {
    return this.get(`/learn/api/v1/calendars/todo/studentItems?since=${since}&until=${until}`)
  }

  getCalendarItems(since, until) {
    return this.get(`/learn/api/v1/calendars/calendarItems?since=${since}&until=${until}`)
  }

  // Devuelve el mismo SyncBundle que usa el resto de la app
  async fetchBundle(now = new Date()) {
    const since = new Date(now.getTime() - 14 * 864e5).toISOString()
    const until = new Date(now.getTime() + 120 * 864e5).toISOString()
    const [calendars, studentItems, calendarItems] = await Promise.all([
      this.getCalendars(),
      this.getStudentItems(since, until),
      this.getCalendarItems(since, until),
    ])
    return buildBundleFromRest({ calendars, studentItems, calendarItems }, now)
  }
}