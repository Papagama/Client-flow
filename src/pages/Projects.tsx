import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsDb, clientsDb, type Project, type ProjectStage } from '../services/storageDb'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useToast } from '../shared/ui/Toast'

const STAGES: ProjectStage[] = ['brief', 'design', 'development', 'revisions', 'delivery']

const STAGE_COLORS: Record<ProjectStage, string> = {
  brief: 'bg-purple-100 text-purple-700',
  design: 'bg-sky-100 text-sky-700',
  development: 'bg-amber-100 text-amber-700',
  revisions: 'bg-orange-100 text-orange-700',
  delivery: 'bg-green-100 text-green-700',
}

const STAGE_LABELS: Record<ProjectStage, string> = {
  brief: 'Бриф', design: 'Дизайн', development: 'Вёрстка', revisions: 'Правки', delivery: 'Сдача',
}

type QuickFilter = '' | 'overdue' | 'next7'
type SortDir = 'asc' | 'desc'

function isOverdue(p: Project): boolean {
  return p.stage !== 'delivery' && p.deadline < new Date().toISOString().slice(0, 10)
}

function isNext7(p: Project): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const week = d.toISOString().slice(0, 10)
  return p.deadline >= today && p.deadline <= week
}

const emptyForm = { title: '', clientId: '', stage: 'brief' as ProjectStage, deadline: '', budget: '', status: 'active' as Project['status'] }

export default function Projects() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState<ProjectStage | ''>('')
  const [quick, setQuick] = useState<QuickFilter>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clients = useMemo(() => clientsDb.getAll(), [])
  const clientMap = useMemo(() => {
    const m = new Map<string, string>()
    clients.forEach(c => m.set(c.id, c.name))
    return m
  }, [clients])

  const refresh = () => setProjects(projectsDb.getAll())
  useEffect(() => { refresh(); setLoading(false) }, [])

  const filtered = useMemo(() => {
    let list = [...projects]
    if (stageFilter) list = list.filter(p => p.stage === stageFilter)
    if (quick === 'overdue') list = list.filter(isOverdue)
    if (quick === 'next7') list = list.filter(isNext7)
    list.sort((a, b) => sortDir === 'asc'
      ? a.deadline.localeCompare(b.deadline)
      : b.deadline.localeCompare(a.deadline))
    return list
  }, [projects, stageFilter, quick, sortDir])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(p: Project) {
    setEditing(p)
    setForm({ title: p.title, clientId: p.clientId, stage: p.stage, deadline: p.deadline, budget: String(p.budget), status: p.status })
    setErrors({})
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Обязательное поле'
    if (!form.clientId) errs.clientId = 'Выберите клиента'
    if (!form.deadline) errs.deadline = 'Укажите дедлайн'
    const budget = parseFloat(form.budget)
    if (!form.budget || isNaN(budget) || budget < 0) errs.budget = 'Укажите бюджет'
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = { title: form.title.trim(), clientId: form.clientId, stage: form.stage, deadline: form.deadline, budget, status: form.status }
    if (editing) {
      projectsDb.update(editing.id, data)
      toast('Проект обновлён')
    } else {
      projectsDb.create(data)
      toast('Проект создан')
    }
    refresh()
    setModalOpen(false)
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const backup = projectsDb.getById(id)
    projectsDb.delete(id)
    refresh()
    toast('Проект удалён', 'success', backup ? {
      label: 'Отменить',
      onClick: () => {
        projectsDb.create({ title: backup.title, clientId: backup.clientId, stage: backup.stage, deadline: backup.deadline, budget: backup.budget, status: backup.status })
        refresh()
      },
    } : undefined)
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400' : 'border-gray-300'}`

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as ProjectStage | '')}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Все этапы</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>

        <div className="flex gap-1">
          {([['', 'Все'], ['overdue', '⚠ Просрочено'], ['next7', '📅 7 дней']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setQuick(val as QuickFilter)}
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                quick === val ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          Дедлайн {sortDir === 'asc' ? '↑' : '↓'}
        </button>

        <button onClick={openCreate} className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Добавить проект
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : projects.length === 0 ? (
        <EmptyState icon="📁" title="Проектов пока нет" description="Создайте первый проект" actionLabel="+ Добавить проект" onAction={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow-sm text-center text-gray-400">Ничего не найдено</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3">Название</th>
                <th className="px-5 py-3">Клиент</th>
                <th className="px-5 py-3">Этап</th>
                <th className="px-5 py-3">Дедлайн</th>
                <th className="px-5 py-3 text-right">Бюджет</th>
                <th className="px-5 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const overdue = isOverdue(p)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/app/projects/${p.id}`)}>
                    <td className="px-5 py-3 font-medium text-indigo-600 hover:text-indigo-800">{p.title}</td>
                    <td className="px-5 py-3 text-gray-600">{clientMap.get(p.clientId) ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[p.stage]}`}>
                        {STAGE_LABELS[p.stage]}
                      </span>
                    </td>
                    <td className={`px-5 py-3 ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {fmt(p.deadline)}{overdue && ' ⚠'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700 font-medium">
                      ${p.budget.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(p) }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Изменить</button>
                      <button onClick={(e) => handleDelete(p.id, e)} className="text-red-500 hover:text-red-700 text-xs font-medium">Удалить</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать проект' : 'Новый проект'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }} className={inputCls(errors.title)} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
            <select value={form.clientId} onChange={e => { setForm(p => ({ ...p, clientId: e.target.value })); setErrors(p => ({ ...p, clientId: '' })) }} className={inputCls(errors.clientId)}>
              <option value="">Выберите клиента…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Этап</label>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as ProjectStage }))} className={inputCls()}>
                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Project['status'] }))} className={inputCls()}>
                <option value="active">Активный</option>
                <option value="on-hold">На паузе</option>
                <option value="completed">Завершён</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={e => { setForm(p => ({ ...p, deadline: e.target.value })); setErrors(p => ({ ...p, deadline: '' })) }} className={inputCls(errors.deadline)} />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет ($)</label>
              <input type="number" step="0.01" value={form.budget} onChange={e => { setForm(p => ({ ...p, budget: e.target.value })); setErrors(p => ({ ...p, budget: '' })) }} className={inputCls(errors.budget)} placeholder="0" />
              {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {editing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
