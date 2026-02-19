import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { tasksDb, projectsDb, type Task, type TaskStatus, type TaskPriority } from '../services/storageDb'
import { useToast } from '../shared/ui/Toast'
import Modal from '../components/Modal'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'К выполнению', color: 'border-gray-300' },
  { id: 'doing', label: 'В процессе', color: 'border-blue-400' },
  { id: 'done', label: 'Готово', color: 'border-green-400' },
]

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-300',
}

const emptyForm = { title: '', description: '', projectId: '', dueDate: '', priority: 'medium' as TaskPriority }

export default function Kanban() {
  const { toast } = useToast()
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)

  const tasks = useMemo(() => tasksDb.getAll(), [tick])
  const projects = useMemo(() => projectsDb.getAll(), [])
  const projectMap = useMemo(() => {
    const m = new Map<string, string>()
    projects.forEach(p => m.set(p.id, p.title))
    return m
  }, [projects])

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeTask = tasks.find(t => t.id === activeId) ?? null

  // Filter
  const [projectFilter, setProjectFilter] = useState('')
  const filteredTasks = useMemo(() => {
    if (!projectFilter) return tasks
    return tasks.filter(t => t.projectId === projectFilter)
  }, [tasks, projectFilter])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<TaskStatus>('todo')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openAddTask(status: TaskStatus) {
    setModalStatus(status)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Обязательное поле'
    if (!form.projectId) errs.projectId = 'Выберите проект'
    if (!form.dueDate) errs.dueDate = 'Укажите дату'
    if (Object.keys(errs).length) { setErrors(errs); return }
    tasksDb.create({
      title: form.title.trim(),
      description: form.description,
      projectId: form.projectId,
      status: modalStatus,
      dueDate: form.dueDate,
      priority: form.priority,
    })
    refresh()
    setModalOpen(false)
    toast('Задача создана')
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const taskId = active.id as string
    const overId = over.id as string
    const targetStatus = COLUMNS.find(c => c.id === overId)?.id
      ?? tasks.find(t => t.id === overId)?.status
    if (!targetStatus) return
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== targetStatus) {
      tasksDb.update(taskId, { status: targetStatus })
      refresh()
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const taskId = active.id as string
    const overId = over.id as string
    const targetStatus = COLUMNS.find(c => c.id === overId)?.id
      ?? tasks.find(t => t.id === overId)?.status
    if (!targetStatus) return
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== targetStatus) {
      tasksDb.update(taskId, { status: targetStatus })
      refresh()
      toast(`Перемещено в ${targetStatus === 'todo' ? 'К выполнению' : targetStatus === 'doing' ? 'В процессе' : 'Готово'}`)
    }
  }

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] }
    filteredTasks.forEach(t => map[t.status]?.push(t))
    return map
  }, [filteredTasks])

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400' : 'border-gray-300'}`

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Все проекты</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {projectFilter && (
          <button onClick={() => setProjectFilter('')} className="text-xs text-gray-400 hover:text-gray-600">✕ Сбросить</button>
        )}
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-[calc(100vh-10rem)]">
          {COLUMNS.map(col => (
            <Column key={col.id} col={col} tasks={grouped[col.id]} projectMap={projectMap} onAdd={() => openAddTask(col.id)} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} projectName={projectMap.get(activeTask.projectId)} overlay />}
        </DragOverlay>
      </DndContext>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новая задача">
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }} className={inputCls(errors.title)} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
            <select value={form.projectId} onChange={e => { setForm(p => ({ ...p, projectId: e.target.value })); setErrors(p => ({ ...p, projectId: '' })) }} className={inputCls(errors.projectId)}>
              <option value="">Выберите проект…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))} className={inputCls()}>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
              <input type="date" value={form.dueDate} onChange={e => { setForm(p => ({ ...p, dueDate: e.target.value })); setErrors(p => ({ ...p, dueDate: '' })) }} className={inputCls(errors.dueDate)} />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">Создать</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

/* ─── Column ────────────────────────────────────────────────────────────── */

function Column({ col, tasks, projectMap, onAdd }: {
  col: typeof COLUMNS[number]
  tasks: Task[]
  projectMap: Map<string, string>
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col rounded-xl bg-gray-50 dark:bg-gray-800 border-t-4 ${col.color} ${isOver ? 'ring-2 ring-indigo-300' : ''}`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{tasks.length}</span>
          <button onClick={onAdd} className="w-6 h-6 rounded-md bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center text-sm transition" title="Добавить задачу">+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(t => (
            <SortableTask key={t.id} task={t} projectName={projectMap.get(t.projectId)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-8">Перетащите задачи сюда</p>
        )}
      </div>
    </div>
  )
}

/* ─── Sortable wrapper ──────────────────────────────────────────────────── */

function SortableTask({ task, projectName }: { task: Task; projectName?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} projectName={projectName} />
    </div>
  )
}

/* ─── Card ──────────────────────────────────────────────────────────────── */

function TaskCard({ task, projectName, overlay }: { task: Task; projectName?: string; overlay?: boolean }) {
  const fmt = (iso: string) => {
    if (!iso) return ''
    return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  return (
    <div className={`bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-600 cursor-grab select-none ${overlay ? 'shadow-lg ring-2 ring-indigo-200' : 'hover:shadow-md transition-shadow'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.low}`} title={task.priority} />
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {projectName && <span className="text-[11px] text-gray-400 truncate max-w-[60%]">{projectName}</span>}
        {task.dueDate && <span className="text-[11px] text-gray-400">{fmt(task.dueDate)}</span>}
      </div>
    </div>
  )
}
