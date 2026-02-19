import { useState, useRef, useMemo } from 'react'
import { useToast } from '../shared/ui/Toast'
import { clientsDb, projectsDb, tasksDb, paymentsDb, linksDb, commentsDb } from '../services/storageDb'

const DB_KEYS = ['db_clients', 'db_projects', 'db_tasks', 'db_payments', 'db_links', 'db_comments', 'db_seeded']

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Глобальный поиск' },
  { keys: ['Esc'], desc: 'Закрыть модальное окно / поиск' },
  { keys: ['↑', '↓'], desc: 'Навигация по результатам поиска' },
  { keys: ['Enter'], desc: 'Открыть выбранный результат' },
]

export default function Settings() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(() => localStorage.getItem('profile_name') ?? 'Админ')
  const [email, setEmail] = useState(() => localStorage.getItem('profile_email') ?? 'admin@clientflow.app')
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') ?? 'light')

  const stats = useMemo(() => {
    const clients = clientsDb.getAll()
    const projects = projectsDb.getAll()
    const tasks = tasksDb.getAll()
    const payments = paymentsDb.getAll()
    const links = linksDb.getAll()
    const comments = commentsDb.getAll()
    let storageBytes = 0
    DB_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) storageBytes += v.length * 2 })
    return { clients: clients.length, projects: projects.length, tasks: tasks.length, payments: payments.length, links: links.length, comments: comments.length, storageKb: (storageBytes / 1024).toFixed(1) }
  }, [])

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('profile_name', name)
    localStorage.setItem('profile_email', email)
    toast('Профиль сохранён')
  }

  function changeTheme(t: string) {
    setTheme(t)
    localStorage.setItem('app_theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    toast(`Тема: ${t === 'light' ? 'светлая' : 'тёмная'}`)
  }

  function exportDb() {
    const data: Record<string, unknown> = {}
    DB_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = JSON.parse(v) })
    data['profile_name'] = localStorage.getItem('profile_name')
    data['profile_email'] = localStorage.getItem('profile_email')
    data['app_theme'] = localStorage.getItem('app_theme')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Бэкап экспортирован')
  }

  function importDb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (typeof data !== 'object' || !data) throw new Error('bad')
        Object.entries(data).forEach(([k, v]) => {
          if (typeof v === 'string') localStorage.setItem(k, v)
          else localStorage.setItem(k, JSON.stringify(v))
        })
        toast('Данные импортированы. Перезагрузка…')
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        toast('Ошибка: неверный формат файла', 'error')
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function resetData() {
    DB_KEYS.forEach(k => localStorage.removeItem(k))
    window.location.reload()
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
      {/* ── Левая колонка (3/5) ── */}
      <div className="lg:col-span-3 space-y-6">
        {/* Профиль */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Профиль</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                Сохранить
              </button>
            </div>
          </form>
        </div>

        {/* Тема */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Тема</h2>
          <div className="flex gap-3">
            {['light', 'dark'].map(t => (
              <button key={t} onClick={() => changeTheme(t)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition ${
                  theme === t
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                <span className="text-xl">{t === 'light' ? '☀️' : '🌙'}</span>
                <span>{t === 'light' ? 'Светлая' : 'Тёмная'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Экспорт / Импорт */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Экспорт / Импорт</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Скачайте полный бэкап или восстановите данные из файла.</p>
          <div className="flex gap-3">
            <button onClick={exportDb} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Экспорт
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Импорт
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={importDb} className="hidden" />
          </div>
        </div>

        {/* Опасная зона */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Опасная зона</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Сбросить все данные к начальным значениям. Это действие необратимо.</p>
          <button onClick={resetData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            Сбросить данные
          </button>
        </div>
      </div>

      {/* ── Правая колонка (2/5) ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Статистика */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Статистика</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{stats.storageKb} КБ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statItems.map(s => (
              <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{s.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Горячие клавиши */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Горячие клавиши</h2>
          <div className="space-y-2.5">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="min-w-[28px] text-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* О приложении */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">О приложении</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">C</div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">ClientFlow</p>
              <p className="text-xs text-gray-400 mt-0.5">Версия 1.0.0</p>
              <p className="text-xs text-gray-400 mt-0.5">CRM для фрилансеров и агентств</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400">Данные хранятся локально в браузере (localStorage). Для сохранности рекомендуем периодически делать экспорт.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
