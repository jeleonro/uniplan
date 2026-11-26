import { buildBundleFromRest } from './mapper.js'

// Datos de ejemplo con la forma exacta de las respuestas de Blackboard Ultra.
// Las fechas límite se generan relativas a "ahora" para que la demo siempre tenga entregas vigentes.
const inHours = (h) => new Date(Date.now() + h * 36e5).toISOString()

export function getDemoPayloads() {
  const calendars = {
    results: [
      { id: '_657206_1', color: '#6f5b27', checked: true, labelLocalizable: { rawValue: '806212447: 202602-COMPUTACIÓN III-311T1' } },
      { id: '_636397_1', color: '#1d4ed8', checked: true, labelLocalizable: { rawValue: '805974916: 202602-D-CONSTITUCIÓN Y DERECHOS HUMANOS-B5T1' } },
      { id: '_640112_1', color: '#15803d', checked: true, labelLocalizable: { rawValue: '806100231: 202602-ESTADÍSTICA APLICADA-311T2' } },
      { id: '_641530_1', color: '#be123c', checked: true, labelLocalizable: { rawValue: '806188402: 202602-BASE DE DATOS-312T1' } },
    ],
  }

  const item = (courseId, title, hours) => ({
    title,
    dueDate: inHours(hours),
    column: { courseId, scoreProviderHandle: 'resource/x-bb-assessment', visible: true },
    contentVisibility: 'VISIBLE',
    isLateAttemptCreationDisallowed: false,
  })

  const studentItems = {
    overdueItems: [],
    dueTodayItems: [item('_657206_1', 'Evaluación: S11_Laboratorio de Algoritmos', 6)],
    futureDueItems: [
      item('_636397_1', 'Evaluación: S11_Ficha de Análisis de Casos', 30),
      item('_640112_1', 'Tarea: Informe de Regresión Lineal', 60),
      item('_641530_1', 'Evaluación: S12_Modelo Entidad-Relación', 150),
      item('_657206_1', 'Foro: Debate de Arquitecturas de Software', 200),
    ],
  }

  // Horas en UTC (Lima = UTC-5): 13:00Z = 08:00 en Lima
  const entry = (id, calendarId, title, location, startUtc, endUtc, days) => ({
    itemSourceId: id,
    itemSourceType: 'blackboard.data.calendar.CalendarEntry',
    calendarId,
    title,
    location,
    startDate: startUtc,
    endDate: endUtc,
    recurRules: { interval: 1, freq: 'WEEKLY', byWeekDay: days, originalStart: startUtc },
  })

  const calendarItems = {
    results: [
      entry('_2175001_1', '_657206_1', '806212447: 202602-COMPUTACIÓN III-311T1', 'Laboratorio de Sistemas III', '2026-11-23T13:00:00.000Z', '2026-11-23T14:30:00.000Z', ['MO', 'WE']),
      entry('_2175934_1', '_636397_1', '805974916: 202602-D-CONSTITUCIÓN Y DERECHOS HUMANOS-B5T1', 'https://zoom.us/j/95052084953', '2026-11-24T15:00:00.000Z', '2026-11-24T16:30:00.000Z', ['TU']),
      entry('_2175102_1', '_640112_1', '806100231: 202602-ESTADÍSTICA APLICADA-311T2', 'Aula 204', '2026-11-26T17:00:00.000Z', '2026-11-26T18:30:00.000Z', ['TH']),
      entry('_2175203_1', '_641530_1', '806188402: 202602-BASE DE DATOS-312T1', 'https://zoom.us/j/81234567890', '2026-11-27T13:00:00.000Z', '2026-11-27T14:30:00.000Z', ['FR']),
      // Se ignora a propósito: ya llega como tarea por studentItems
      { itemSourceId: '_9000001_1', itemSourceType: 'blackboard.platform.gradebook2.GradableItem', calendarId: '_657206_1', title: 'Evaluación: S11_Laboratorio de Algoritmos', startDate: inHours(6), endDate: inHours(6) },
    ],
  }

  return { calendars, studentItems, calendarItems }
}

export function getDemoBundle() {
  return buildBundleFromRest(getDemoPayloads())
}