import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsDb, clientsDb, tasksDb, paymentsDb, linksDb, commentsDb } from '../services/storageDb'
import type { Project, Client, Task, TaskStatus, TaskPriority, Payment, PaymentStatus, Link, Comment } from '../services/storageDb'
import { useToast } from '../shared/ui/Toast'
import { supabase } from '../services/supabase'
import Modal from '../components/Modal'

const STAGE_COLORS: Record<string, string> = { brief: 'bg-purple-100 text-purple-700', design: 'bg-sky-100 text-sky-700', development: 'bg-amber-100 text-amber-700', revisions: 'bg-orange-100 text-orange-700', delivery: 'bg-green-100 text-green-700' }
const STAGE_LABELS: Record<string, string> = { brief: 'Бриф', design: 'Дизайн', development: 'Вёрстка', revisions: 'Правки', delivery: 'Сдача' }
const TASK_STATUS: Record<TaskStatus, string> = { todo: 'bg-gray-100 text-gray-600', doing: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' }
const TASK_STATUS_LABELS: Record<TaskStatus, string> = { todo: 'К выполнению', doing: 'В процессе', done: 'Готово' }
const PRIORITY_COLORS: Record<TaskPriority, string> = { low: 'bg-gray-100 text-gray-500', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' }
const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }
const PAY_COLORS: Record<string, string> = { paid: 'bg-green-100 text-green-700', partial: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-100 text-red-700' }
const PAY_LABELS: Record<string, string> = { paid: 'Оплачено', partial: 'Частично', unpaid: 'Не оплачено' }
const TAB_LABELS: Record<string, string> = { tasks: 'Задачи', payments: 'Оплаты', links: 'Ссылки' }
type Tab = 'tasks' | 'payments' | 'links'

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('tasks')
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | undefined>()
  const [client, setClient] = useState<Client | undefined>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [links, setLinks] = useState<Link[]>([])

  const loadData = useCallback(async () => {
    if (!id) return
    const p = await projectsDb.getById(id)
    setProject(p)
    if (p) { const c = await clientsDb.getById(p.clientId); setClient(c) }
    const [t, pay, l] = await Promise.all([tasksDb.getByProject(id), paymentsDb.getByProject(id), linksDb.getByProject(id)])
    setTasks(t); setPayments(pay); setLinks(l); setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Загрузка…</div>
  if (!project) return <div className="text-center py-20 text-gray-400">Проект не найден.<button onClick={() => navigate('/app/projects')} className="ml-2 text-indigo-600 hover:underline">Назад</button></div>

  async function duplicateProject() {
    if (!project) return
    const newP = await projectsDb.create({ title: project.title + ' (копия)', clientId: project.clientId, stage: project.stage, deadline: project.deadline, budget: project.budget, status: project.status })
    for (const t of tasks) await tasksDb.create({ projectId: newP.id, title: t.title, description: t.description, status: t.status, dueDate: t.dueDate, priority: t.priority })
    for (const p of payments) await paymentsDb.create({ projectId: newP.id, amount: p.amount, description: p.description, date: p.date, status: p.status })
    for (const l of links) await linksDb.create({ projectId: newP.id, label: l.label, url: l.url })
    toast('Проект дублирован'); navigate(`/app/projects/${newP.id}`)
  }

  function exportProject() {
    if (!project) return
    const report = {
      project: { title: project.title, stage: project.stage, status: project.status, deadline: project.deadline, budget: project.budget, createdAt: project.createdAt },
      client: client ? { name: client.name, contact: client.contact, niche: client.niche } : null,
      tasks: tasks.map(t => ({ title: t.title, description: t.description, status: t.status, priority: t.priority, dueDate: t.dueDate })),
      payments: payments.map(p => ({ description: p.description, amount: p.amount, date: p.date, status: p.status })),
      links: links.map(l => ({ label: l.label, url: l.url })),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}-report.json`; a.click(); URL.revokeObjectURL(url)
    toast('Отчёт экспортирован')
  }

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  const statusLabel: Record<string, string> = { active: 'Активный', 'on-hold': 'На паузе', completed: 'Завершён' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/app/projects')} className="text-sm text-gray-500 hover:text-gray-700">← К списку проектов</button>
        <div className="flex gap-2">
          <button onClick={duplicateProject} className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition">📋 Дублировать</button>
          <button onClick={exportProject} className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition">📥 Экспорт</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold text-gray-800">{project.title}</h2><p className="text-sm text-gray-500 mt-1">Клиент: {client?.name ?? '—'}</p></div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STAGE_COLORS[project.stage] ?? ''}`}>{STAGE_LABELS[project.stage] ?? project.stage}</span>
        </div>
        <div className="flex gap-6 mt-4 text-sm text-gray-600">
          <span>Дедлайн: <span className="font-medium text-gray-800">{fmt(project.deadline)}</span></span>
          <span>Бюджет: <span className="font-medium text-gray-800">{project.budget.toLocaleString()} ₽</span></span>
          <span>Статус: <span className="font-medium text-gray-800">{statusLabel[project.status] ?? project.status}</span></span>
        </div>
        {tasks.length > 0 && (() => {
          const pct = Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
          return (<div className="mt-4"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Прогресс</span><span>{pct}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div></div>)
        })()}
      </div>
      <div className="flex gap-1 border-b border-gray-200">
        {(['tasks', 'payments', 'links'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {TAB_LABELS[t]} ({t === 'tasks' ? tasks.length : t === 'payments' ? payments.length : links.length})
          </button>
        ))}
      </div>
      {tab === 'tasks' && <TasksTab tasks={tasks} projectId={project.id} refresh={loadData} toast={toast} />}
      {tab === 'payments' && <PaymentsTab payments={payments} projectId={project.id} refresh={loadData} toast={toast} />}
      {tab === 'links' && <LinksTab links={links} projectId={project.id} refresh={loadData} toast={toast} />}
    </div>
  )
}

/* ─── Tasks Tab ─────────────────────────────────────────────────────────── */
const emptyTaskForm = { title: '', description: '', status: 'todo' as TaskStatus, dueDate: '', priority: 'medium' as TaskPriority }

function TasksTab({ tasks, projectId, refresh, toast }: { tasks: Task[]; projectId: string; refresh: () => void; toast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyTaskForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  function openCreate() { setEditing(null); setForm(emptyTaskForm); setErrors({}); setModalOpen(true) }
  function openEdit(t: Task) { setEditing(t); setForm({ title: t.title, description: t.description, status: t.status, dueDate: t.dueDate, priority: t.priority }); setErrors({}); setModalOpen(true) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Обязательное поле'
    if (!form.dueDate) errs.dueDate = 'Укажите дату'
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (editing) { await tasksDb.update(editing.id, form); toast('Задача обновлена') }
    else { await tasksDb.create({ ...form, projectId }); toast('Задача создана') }
    refresh(); setModalOpen(false)
  }

  async function remove(id: string) { await tasksDb.delete(id); refresh(); toast('Задача удалена') }

  const inputCls = (err?: string) => `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400' : 'border-gray-300'}`
  const sorted = [...tasks].sort((a, b) => { const o: Record<TaskStatus, number> = { todo: 0, doing: 1, done: 2 }; return o[a.status] - o[b.status] })

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">+ Добавить задачу</button></div>
      {sorted.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Задач пока нет</p> : (
        <div className="space-y-2">
          {sorted.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)} className="text-gray-400 hover:text-gray-600 shrink-0">{expandedTask === t.id ? '▾' : '▸'}</button>
                  <div className="min-w-0"><p className="text-sm font-medium text-gray-800">{t.title}</p>{t.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TASK_STATUS[t.status]}`}>{TASK_STATUS_LABELS[t.status]}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{PRIORITY_LABELS[t.priority]}</span>
                  <span className="text-xs text-gray-400">{new Date(t.dueDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                  <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Изменить</button>
                  <button onClick={() => remove(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Удалить</button>
                </div>
              </div>
              {expandedTask === t.id && <CommentsSection taskId={t.id} />}
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать задачу' : 'Новая задача'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Название</label><input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }} className={inputCls(errors.title)} />{errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}</div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Описание</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls()} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Статус</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as TaskStatus }))} className={inputCls()}><option value="todo">К выполнению</option><option value="doing">В процессе</option><option value="done">Готово</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label><select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))} className={inputCls()}><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Срок</label><input type="date" value={form.dueDate} onChange={e => { setForm(p => ({ ...p, dueDate: e.target.value })); setErrors(p => ({ ...p, dueDate: '' })) }} className={inputCls(errors.dueDate)} />{errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">{editing ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ─── Comments Section ──────────────────────────────────────────────────── */
function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')

  useEffect(() => { commentsDb.getByTask(taskId).then(setComments) }, [taskId])

  async function addComment() {
    if (!text.trim()) return
    const { data } = await supabase.auth.getUser()
    const author = data.user?.user_metadata?.name ?? 'Админ'
    await commentsDb.create({ taskId, text: text.trim(), author })
    setComments(await commentsDb.getByTask(taskId)); setText('')
  }

  async function removeComment(id: string) { await commentsDb.delete(id); setComments(await commentsDb.getByTask(taskId)) }
  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 mb-2">💬 Комментарии ({comments.length})</p>
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 group">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{c.author.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-medium text-gray-700">{c.author}</span><span className="text-[10px] text-gray-400">{fmt(c.createdAt)}</span></div><p className="text-xs text-gray-600 mt-0.5">{c.text}</p></div>
              <button onClick={() => removeComment(c.id)} className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey} placeholder="Написать комментарий…" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={addComment} disabled={!text.trim()} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition">Отправить</button>
      </div>
    </div>
  )
}

/* ─── Payments Tab ──────────────────────────────────────────────────────── */
function PaymentsTab({ payments, projectId, refresh, toast }: { payments: Payment[]; projectId: string; refresh: () => void; toast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', date: '', status: 'unpaid' as PaymentStatus })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  const total = payments.reduce((s, p) => s + p.amount, 0)
  const paid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  async function cycleStatus(p: Payment) {
    const next: Record<PaymentStatus, PaymentStatus> = { unpaid: 'partial', partial: 'paid', paid: 'unpaid' }
    await paymentsDb.update(p.id, { status: next[p.status] }); refresh(); toast(`Статус → ${PAY_LABELS[next[p.status]]}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) errs.amount = 'Введите сумму'
    if (!form.description.trim()) errs.description = 'Обязательное поле'
    if (!form.date) errs.date = 'Укажите дату'
    if (Object.keys(errs).length) { setErrors(errs); return }
    await paymentsDb.create({ projectId, amount, description: form.description.trim(), date: form.date, status: form.status })
    setForm({ amount: '', description: '', date: '', status: 'unpaid' }); setErrors({}); setShowForm(false); refresh(); toast('Оплата добавлена')
  }

  async function remove(id: string) { await paymentsDb.delete(id); refresh(); toast('Оплата удалена') }
  const inputCls = (err?: string) => `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm"><span className="text-gray-500">Всего: <span className="font-medium text-gray-800">{total.toLocaleString()} ₽</span></span><span className="text-gray-500">Оплачено: <span className="font-medium text-green-700">{paid.toLocaleString()} ₽</span></span></div>
        <button onClick={() => setShowForm(v => !v)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">{showForm ? 'Отмена' : '+ Добавить оплату'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽)</label><input type="number" step="0.01" value={form.amount} onChange={e => { setForm(p => ({ ...p, amount: e.target.value })); setErrors(p => ({ ...p, amount: '' })) }} className={inputCls(errors.amount)} placeholder="0.00" />{errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Дата</label><input type="date" value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, date: '' })) }} className={inputCls(errors.date)} />{errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}</div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Описание</label><input value={form.description} onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: '' })) }} className={inputCls(errors.description)} placeholder="напр. Аванс за дизайн" />{errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}</div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Статус</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as PaymentStatus }))} className={inputCls()}><option value="unpaid">Не оплачено</option><option value="partial">Частично</option><option value="paid">Оплачено</option></select></div>
          <div className="flex justify-end"><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Создать</button></div>
        </form>
      )}
      {payments.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Оплат пока нет</p> : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div><p className="text-sm text-gray-800">{p.description}</p><p className="text-xs text-gray-400">{fmt(p.date)}</p></div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{p.amount.toLocaleString()} ₽</span>
                <button onClick={() => cycleStatus(p)} className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition hover:opacity-80 ${PAY_COLORS[p.status]}`}>{PAY_LABELS[p.status]}</button>
                <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Links Tab ─────────────────────────────────────────────────────────── */
function LinksTab({ links, projectId, refresh, toast }: { links: Link[]; projectId: string; refresh: () => void; toast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  async function add() {
    if (!label.trim() || !url.trim()) return
    await linksDb.create({ projectId, label: label.trim(), url: url.trim() }); setLabel(''); setUrl(''); refresh(); toast('Ссылка добавлена')
  }

  async function remove(id: string) { await linksDb.delete(id); refresh(); toast('Ссылка удалена') }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Название" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={add} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Добавить</button>
      </div>
      {links.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Ссылок пока нет</p> : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {links.map(l => (
            <div key={l.id} className="flex items-center justify-between px-5 py-3">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{l.label}</a>
              <button onClick={() => remove(l.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
