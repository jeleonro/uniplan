import { NavLink, Outlet } from 'react-router-dom'
import { Home, ListChecks, Clock, CalendarDays, Bell } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/tareas', label: 'Tareas', icon: ListChecks },
  { to: '/horario', label: 'Horario', icon: Clock },
  { to: '/entregas', label: 'Entregas', icon: CalendarDays },
  { to: '/alertas', label: 'Alertas', icon: Bell },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative mx-auto min-h-screen max-w-md bg-slate-50">
        <main className="px-6 pb-28 pt-8">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <ul className="flex items-center justify-around py-2">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`
                  }
                >
                  <Icon size={22} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}