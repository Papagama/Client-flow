import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsDb, clientsDb, tasksDb, paymentsDb } from '../services/storageDb'
import { SkeletonCards, SkeletonTable } from '../components/Skeleton'
import TaskChart from '../components/TaskChart'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().slice(0, 10)
  const week = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10) })()

  const projects = useMemo(() => projectsDb.getAll(), [])
  const tasks = useMemo(() => tasksDb.getAll(), [])
  const payments = useMemo(() => paymentsDb.getAll(), [])
  const clientMap = useMemo(() => {
    const m = new Map<string, string>()
    clientsDb.getAll().forEach(c => m.set(c.id, c.name))
    return m
  }, [])

  const activeProjects = projects.filter(p => p.status === 'active')
  const unpaidPayments = payments.filter(p => p.status !== 'paid')
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate < today)
  const upcomingDeadlines = projects
    .filter(p => p.stage !== 'delivery' && p.deadline >= today && p.deadline <= week)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))

  const unpaidTotal = unpaidPayments.reduce((s, p) => s + p.amount, 0)

  useEffect(() => { setLoading(false) }, [])

  const cards = [
    { label: 'Проекты в работе', value: activeProjects.length, sub: `из ${projects.length} всего`, icon: '📁', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Ожидают оплаты', value: `${unpaidTotal.toLocaleString()}`, sub: `${unpaidPayments.length} счёт(ов)`, icon: '💰', color: 'bg-amber-50 text-amber-600' },
    { label: 'Просроченные задачи', value: overdueTasks.length, sub: 'требуют внимания', icon: '⚠️', color: 'bg-red-50 text-red-600' },
    { label: 'Дедлайны за 7 дней', value: upcomingDeadlines.length, sub: 'проект(ов)', icon: '📅', color: 'bg-sky-50 text-sky-600' },
  ]

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  const daysLeft = (iso: string) => {
    const diff = Math.ceil((new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
    if (diff === 0) return 'Сегодня'
    if (diff === 1) return 'Завтра'
    return `${diff} дн.`
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Добро пожаловать</p>

      {loading ? <SkeletonCards count={4} /> : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{c.label}</p>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${c.color}`}>{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskChart tasks={tasks} />

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Ближайшие дедлайны</h2>
        {loading ? (
          <SkeletonTable rows={3} cols={3} />
        ) : upcomingDeadlines.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400 text-sm">Нет дедлайнов в ближайшие 7 дней</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {upcomingDeadlines.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/app/projects/${p.id}`)}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.title}</p>
                  <p className="text-xs text-gray-400">{clientMap.get(p.clientId) ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{fmt(p.deadline)}</p>
                  <p className="text-xs text-amber-600">{daysLeft(p.deadline)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
