import { MapPin, Video } from 'lucide-react'

// Muestra el aula o, si la clase es virtual, un acceso directo al enlace (Zoom, Meet, Teams)
export default function ClassPlace({ session }) {
  if (session.meeting_url) {
    return (
      <a
        href={session.meeting_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 font-medium text-indigo-600"
      >
        <Video size={14} />
        {session.location ?? 'Aula Virtual'}
      </a>
    )
  }
  if (session.location) {
    return (
      <span className="flex items-center gap-1">
        <MapPin size={14} />
        {session.location}
      </span>
    )
  }
  return null
}