const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const pad = (n) => String(n).padStart(2, '0')

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDue(iso) {
  const due = new Date(iso)
  const diffDays = Math.round((startOfDay(due) - startOfDay(new Date())) / 86400000)
  const time = `${pad(due.getHours())}:${pad(due.getMinutes())}`
  const short = `${due.getDate()} ${MONTHS[due.getMonth()]}`

  if (diffDays < 0) return `Vencida · ${short}`
  if (diffDays === 0) return `Hoy, ${time}`
  if (diffDays === 1) return `Mañana, ${time}`
  if (diffDays <= 6) return `En ${diffDays} días`
  return short
}