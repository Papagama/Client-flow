import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { clientsDb, projectsDb, type Client, type Project, type ClientStatus, type ProjectStage } from '../services/storageDb'

const STATUS_COLORS: Record<ClientStatus, string> = {
  lead: 'bg-amber-100 text-amber-700', active: 'bg-green-100 text-green-700', paused: 'bg-gray-100 text-gray-600', done: 'bg-blue-100 text-blue-700',
}
const STATUS_LABELS: Record<ClientStatus, string> = { lead: 'Лид', active: 'В работе', paused: 'Пауза', done: 'Готово' }
const STAGE_COLORS: Record<ProjectStage, string> = {
  brief: 'bg-purple-100 text-purple-700', design: 'bg-sky-100 text-sky-700', development: 'bg-amber-100 text-amber-700', revisions: 'bg-orange-100 text-orange-700', delivery: 'bg-green-100 text-green-700',
}
const STAGE_LABELS: Record<ProjectStage, string> = { brief: 'Бриф', design: 'Дизайн', development: 'Вёрстка', revisions: 'Правки', delivery: 'Сдача' }

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | undefined>()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([clientsDb.getById(id), projectsDb.getByClient(id)]).then(([c, p]) => {
      setClient(c); setProjects(p); setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Загрузка…</div>

  if (!client) {
    return (
      <div className="text-center py-20 text-gray-400">
        Клиент не найден.
        <button onClick={() => navigate('/app/clients')} className="ml-2 text-indigo-600 hover:underline">Назад</button>
      </div>
    )
  }

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/app/clients')} className="text-sm text-gray-500 hover:text-gray-700">← К списку клиентов</button>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{client.contact}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[client.status]}`}>{STATUS_LABELS[client.status]}</span>
        </div>
        <div className="flex gap-6 mt-4 text-sm text-gray-600">
          <span>Ниша: <span className="font-medium text-gray-800">{client.niche}</span></span>
          <span>Создан: <span className="font-medium text-gray-800">{new Date(client.createdAt).toLocaleDateString('ru-RU')}</span></span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Проекты ({projects.length})</h3>
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400 text-sm">У клиента пока нет проектов</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr><th className="px-5 py-3">Название</th><th className="px-5 py-3">Этап</th><th className="px-5 py-3">Дедлайн</th><th className="px-5 py-3 text-right">Бюджет</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/app/projects/${p.id}`)}>
                    <td className="px-5 py-3 font-medium text-indigo-600 hover:text-indigo-800">{p.title}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[p.stage]}`}>{STAGE_LABELS[p.stage]}</span></td>
                    <td className="px-5 py-3 text-gray-600">{fmt(p.deadline)}</td>
                    <td className="px-5 py-3 text-right text-gray-700 font-medium">{p.budget.toLocaleString()} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
