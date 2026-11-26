import { RefreshCw } from 'lucide-react'

export default function SyncBadge({ source }) {
  if (source !== 'blackboard') return null
  return (
    <span
      title="Sincronizado desde Blackboard"
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
    >
      <RefreshCw size={10} />
      Bb
    </span>
  )
}