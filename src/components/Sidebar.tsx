import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { tasksDb } from '../services/storageDb'
import { supabase } from '../services/supabase'

interface Props {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: Props) {
  const navigate = useNavigate()
  const [overdueTasks, setOverdueTasks] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    tasksDb.getAll().then(tasks => {
      setOverdueTasks(tasks.filter(t => t.status !== 'done' && t.dueDate < today).length)
    })
  }, [])

  const links = [
    { to: '/app/dashboard', label: 'Дашборд', icon: '📊', badge: 0 },
    { to: '/app/clients', label: 'Клиенты', icon: '👥', badge: 0 },
    { to: '/app/projects', label: 'Проекты', icon: '📁', badge: 0 },
    { to: '/app/kanban', label: 'Канбан', icon: '📋', badge: overdueTasks },
    { to: '/app/settings', label: 'Настройки', icon: '⚙️', badge: 0 },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-60 h-full bg-gray-900 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 text-xl font-bold border-b border-gray-700">
        ClientFlow
      </div>
      <nav className="flex-1 py-4">
        {links.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-gray-700 ${
                isActive ? 'bg-gray-700 text-white font-medium' : 'text-gray-400'
              }`
            }
          >
            <span>{icon}</span>
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-2">
        <p className="text-[10px] text-gray-600 text-center">Ctrl+K — поиск</p>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
      >
        <span>🚪</span>
        Выйти
      </button>
    </aside>
  )
}
