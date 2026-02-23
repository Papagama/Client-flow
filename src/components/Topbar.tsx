import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { tasksDb, paymentsDb, projectsDb } from '../services/storageDb'
import { supabase } from '../services/supabase'

const titles: Record<string, string> = {
  '/app/dashboard': 'Дашборд', '/app/clients': 'Клиенты', '/app/projects': 'Проекты', '/app/kanban': 'Канбан', '/app/settings': 'Настройки',
}

interface Props { onMenuClick?: () => void }
interface Notification { id: string; icon: string; text: string; link?: string; color: string }

export default function Topbar({ onMenuClick }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userName, setUserName] = useState('Админ')
  const [userEmail, setUserEmail] = useState('')

  const title = titles[pathname] ?? (pathname.startsWith('/app/clients/') ? 'Карточка клиента' : pathname.startsWith('/app/projects/') ? 'Детали проекта' : 'Приложение')
  const initial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Админ')
        setUserEmail(data.user.email ?? '')
      }
    })
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([tasksDb.getAll(), paymentsDb.getAll(), projectsDb.getAll()]).then(([tasks, payments, projects]) => {
      const items: Notification[] = []
      const projectMap = new Map(projects.map(p => [p.id, p.title]))
      tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today).slice(0, 5).forEach(t => {
        items.push({ id: 'ot-' + t.id, icon: '⚠️', text: `Просрочена: ${t.title}`, color: 'text-red-500', link: `/app/projects/${t.projectId}` })
      })
      const soon = new Date(); soon.setDate(soon.getDate() + 3); const soonStr = soon.toISOString().slice(0, 10)
      tasks.filter(t => t.status !== 'done' && t.dueDate >= today && t.dueDate <= soonStr).slice(0, 3).forEach(t => {
        items.push({ id: 'ut-' + t.id, icon: '📅', text: `Скоро: ${t.title} (${t.dueDate})`, color: 'text-amber-500' })
      })
      payments.filter(p => p.status === 'unpaid').slice(0, 3).forEach(p => {
        items.push({ id: 'up-' + p.id, icon: '💰', text: `Не оплачено: ${p.amount} ₽ — ${projectMap.get(p.projectId) ?? ''}`, color: 'text-orange-500', link: `/app/projects/${p.projectId}` })
      })
      setNotifications(items)
    })
  }, [pathname])

  useEffect(() => {
    if (!menuOpen && !bellOpen) return
    function handler(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (bellOpen && bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, bellOpen])

  function openSearch() { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) }
  function go(path: string) { navigate(path); setMenuOpen(false); setBellOpen(false) }
  async function handleLogout() { await supabase.auth.signOut(); navigate('/login') }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={openSearch} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition">
          <span>🔍</span><span>Поиск…</span><kbd className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">Ctrl+K</kbd>
        </button>
        <div className="relative" ref={bellRef}>
          <button onClick={() => setBellOpen(v => !v)} className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {notifications.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notifications.length > 9 ? '9+' : notifications.length}</span>}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Уведомления</p></div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Всё чисто 🎉</p> : notifications.map(n => (
                  <button key={n.id} onClick={() => n.link ? go(n.link) : setBellOpen(false)} className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <span className="text-base shrink-0 mt-0.5">{n.icon}</span><span className={`text-xs leading-relaxed ${n.color}`}>{n.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{userName}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">{initial}</div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700"><p className="text-sm font-medium text-gray-800 dark:text-gray-100">{userName}</p><p className="text-xs text-gray-400 truncate">{userEmail}</p></div>
              <button onClick={() => go('/app/settings')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"><span>⚙️</span> Настройки</button>
              <button onClick={() => go('/app/dashboard')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"><span>📊</span> Дашборд</button>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition text-left"><span>🚪</span> Выйти</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
