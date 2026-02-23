import { useState, useEffect } from 'react'
import { useToast } from '../shared/ui/Toast'
import { clientsDb, projectsDb, tasksDb, paymentsDb, linksDb, commentsDb } from '../services/storageDb'
import { supabase } from '../services/supabase'

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Глобальный поиск' },
  { keys: ['Esc'], desc: 'Закрыть модальное окно / поиск' },
  { keys: ['↑', '↓'], desc: 'Навигация по результатам поиска' },
  { keys: ['Enter'], desc: 'Открыть выбранный результат' },
]

export default function Settings() {
  const { toast } = useToast()
  const [name, setName] = useState('Админ')
  const [email, setEmail] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') ?? 'light')
  const [stats, setStats] = useState({ clients: 0, projects: 0, tasks: 0, payments: 0, links: 0, comments: 0 })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setName(data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Админ')
        setEmail(data.user.email ?? '')
      }
    })
    Promise.all([clientsDb.getAll(), projectsDb.getAll(), tasksDb.getAll(), paymentsDb.getAll(), linksDb.getAll(), commentsDb.getAll()])
      .then(([c, p, t, pay, l, com]) => setStats({ clients: c.length, projects: p.length, tasks: t.length, payments: pay.length, links: l.length, comments: com.length }))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    await supabase.auth.updateUser({ data: { name } })
    toast('Профиль сохранён')
  }

  function changeTheme(t: string) {
    setTheme(t); localStorage.setItem('app_theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    toast(`Тема: ${t === 'light' ? 'светлая' : 'тёмная'}`)
  }

  const statItems = [
    { icon: '👥', label: 'Клиенты', value: stats.clients },
    { icon: '📁', label: 'Проекты', value: stats.projects },
    { icon: '✅', label: 'Задачи', value: stats.tasks },
    { icon: '💰', label: 'Оплаты', value: stats.payments },
    { icon: '🔗', label: 'Ссылки', value: stats.links },
    { icon: '💬', label: 'Комментарии', value: stats.comments },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Профиль</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Имя</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={email} disabled className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none bg-gray-50 text-gray-500" /></div>
            <div className="flex justify-end pt-2"><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Сохранить</button></div>
          </form>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Тема</h2>
          <div className="flex gap-3">
            {['light', 'dark'].map(t => (
              <button key={t} onClick={() => changeTheme(t)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition ${theme === t ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                <span className="text-xl">{t === 'light' ? '☀️' : '🌙'}</span><span>{t === 'light' ? 'Светлая' : 'Тёмная'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-3">
            {statItems.map(s => (
              <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-lg">{s.icon}</span>
                <div><p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{s.value}</p><p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Горячие клавиши</h2>
          <div className="space-y-2.5">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{s.desc}</span>
                <div className="flex gap-1">{s.keys.map(k => <kbd key={k} className="min-w-[28px] text-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">{k}</kbd>)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">О приложении</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">C</div>
            <div><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">ClientFlow</p><p className="text-xs text-gray-400 mt-0.5">Версия 2.0.0 — Supabase</p><p className="text-xs text-gray-400 mt-0.5">CRM для фрилансеров и агентств</p></div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-400">Данные хранятся в облаке (Supabase). Доступ с любого устройства.</p></div>
        </div>
      </div>
    </div>
  )
}
