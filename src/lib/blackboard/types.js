/**
 * Modelos de dominio de la sincronización con Blackboard (JSDoc, sin TypeScript).
 *
 * @typedef {'manual'|'blackboard'} DataSource
 *
 * @typedef {Object} SyncCourse
 * @property {string} externalId   Id estable en Blackboard (o clave derivada en el .ics)
 * @property {string} name         Nombre limpio, ej. "COMPUTACIÓN III"
 * @property {string|null} section Sección, ej. "311T1"
 * @property {string|null} term    Periodo, ej. "202602"
 * @property {string} color        Clave de paleta: indigo | blue | orange | green | rose | amber
 *
 * @typedef {Object} SyncTask
 * @property {string} externalId
 * @property {string|null} courseExternalId
 * @property {string} title
 * @property {string} dueAt        ISO en UTC
 * @property {'baja'|'media'|'alta'} priority
 *
 * @typedef {Object} SyncSession
 * @property {string} externalId
 * @property {string} courseExternalId
 * @property {number} dayOfWeek    1 = lunes ... 7 = domingo (hora de Lima)
 * @property {string} startTime    "HH:MM" (hora de Lima)
 * @property {string} endTime      "HH:MM" (hora de Lima)
 * @property {string|null} location
 * @property {string|null} meetingUrl
 *
 * @typedef {Object} SyncBundle
 * @property {SyncCourse[]} courses
 * @property {SyncTask[]} tasks
 * @property {SyncSession[]} sessions
 */

export const SOURCE = { MANUAL: 'manual', BLACKBOARD: 'blackboard' }
export const BB_HOST = 'ucv.blackboard.com'
export const BB_TIMEZONE = 'America/Lima'