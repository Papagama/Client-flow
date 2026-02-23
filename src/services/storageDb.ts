import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClientStatus = 'lead' | 'active' | 'paused' | 'done'

export interface Client {
  id: string
  name: string
  contact: string
  niche: string
  status: ClientStatus
  createdAt: string
}

export type ProjectStage = 'brief' | 'design' | 'development' | 'revisions' | 'delivery'

export interface Project {
  id: string
  clientId: string
  title: string
  stage: ProjectStage
  deadline: string
  budget: number
  status: 'active' | 'completed' | 'on-hold'
  createdAt: string
}

export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  dueDate: string
  priority: TaskPriority
  createdAt: string
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface Payment {
  id: string
  projectId: string
  amount: number
  description: string
  date: string
  status: PaymentStatus
}

export interface Link {
  id: string
  projectId: string
  label: string
  url: string
}

export interface Comment {
  id: string
  taskId: string
  text: string
  author: string
  createdAt: string
}

// ─── Error hook ──────────────────────────────────────────────────────────────

export const storageDb = {
  onError: null as ((msg: string) => void) | null,
}

function handleError(msg: string) {
  storageDb.onError?.(msg)
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? ''
}

// ─── Row mappers (snake_case → camelCase) ────────────────────────────────────

function mapClient(r: Record<string, unknown>): Client {
  return { id: r.id as string, name: r.name as string, contact: r.contact as string, niche: r.niche as string, status: r.status as ClientStatus, createdAt: r.created_at as string }
}
function mapProject(r: Record<string, unknown>): Project {
  return { id: r.id as string, clientId: r.client_id as string, title: r.title as string, stage: r.stage as ProjectStage, deadline: r.deadline as string, budget: Number(r.budget), status: r.status as Project['status'], createdAt: r.created_at as string }
}
function mapTask(r: Record<string, unknown>): Task {
  return { id: r.id as string, projectId: r.project_id as string, title: r.title as string, description: r.description as string, status: r.status as TaskStatus, dueDate: r.due_date as string, priority: r.priority as TaskPriority, createdAt: r.created_at as string }
}
function mapPayment(r: Record<string, unknown>): Payment {
  return { id: r.id as string, projectId: r.project_id as string, amount: Number(r.amount), description: r.description as string, date: r.date as string, status: r.status as PaymentStatus }
}
function mapLink(r: Record<string, unknown>): Link {
  return { id: r.id as string, projectId: r.project_id as string, label: r.label as string, url: r.url as string }
}
function mapComment(r: Record<string, unknown>): Comment {
  return { id: r.id as string, taskId: r.task_id as string, text: r.text as string, author: r.author as string, createdAt: r.created_at as string }
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsDb = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (error) { handleError('Не удалось загрузить клиентов'); return [] }
    return (data ?? []).map(mapClient)
  },
  async getById(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    if (error) return undefined
    return mapClient(data)
  },
  async create(d: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('clients').insert({ user_id: uid, name: d.name, contact: d.contact, niche: d.niche, status: d.status }).select().single()
    if (error) { handleError('Не удалось создать клиента'); throw error }
    return mapClient(data)
  },
  async update(id: string, d: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    const upd: Record<string, unknown> = {}
    if (d.name !== undefined) upd.name = d.name
    if (d.contact !== undefined) upd.contact = d.contact
    if (d.niche !== undefined) upd.niche = d.niche
    if (d.status !== undefined) upd.status = d.status
    const { data, error } = await supabase.from('clients').update(upd).eq('id', id).select().single()
    if (error) { handleError('Не удалось обновить клиента'); throw error }
    return mapClient(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) handleError('Не удалось удалить клиента')
  },
}

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsDb = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (error) { handleError('Не удалось загрузить проекты'); return [] }
    return (data ?? []).map(mapProject)
  },
  async getById(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (error) return undefined
    return mapProject(data)
  },
  async getByClient(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []).map(mapProject)
  },
  async create(d: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('projects').insert({ user_id: uid, client_id: d.clientId, title: d.title, stage: d.stage, deadline: d.deadline, budget: d.budget, status: d.status }).select().single()
    if (error) { handleError('Не удалось создать проект'); throw error }
    return mapProject(data)
  },
  async update(id: string, d: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> {
    const upd: Record<string, unknown> = {}
    if (d.clientId !== undefined) upd.client_id = d.clientId
    if (d.title !== undefined) upd.title = d.title
    if (d.stage !== undefined) upd.stage = d.stage
    if (d.deadline !== undefined) upd.deadline = d.deadline
    if (d.budget !== undefined) upd.budget = d.budget
    if (d.status !== undefined) upd.status = d.status
    const { data, error } = await supabase.from('projects').update(upd).eq('id', id).select().single()
    if (error) { handleError('Не удалось обновить проект'); throw error }
    return mapProject(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) handleError('Не удалось удалить проект')
  },
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksDb = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (error) { handleError('Не удалось загрузить задачи'); return [] }
    return (data ?? []).map(mapTask)
  },
  async getById(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single()
    if (error) return undefined
    return mapTask(data)
  },
  async getByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []).map(mapTask)
  },
  async create(d: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('tasks').insert({ user_id: uid, project_id: d.projectId, title: d.title, description: d.description, status: d.status, due_date: d.dueDate, priority: d.priority }).select().single()
    if (error) { handleError('Не удалось создать задачу'); throw error }
    return mapTask(data)
  },
  async update(id: string, d: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const upd: Record<string, unknown> = {}
    if (d.projectId !== undefined) upd.project_id = d.projectId
    if (d.title !== undefined) upd.title = d.title
    if (d.description !== undefined) upd.description = d.description
    if (d.status !== undefined) upd.status = d.status
    if (d.dueDate !== undefined) upd.due_date = d.dueDate
    if (d.priority !== undefined) upd.priority = d.priority
    const { data, error } = await supabase.from('tasks').update(upd).eq('id', id).select().single()
    if (error) { handleError('Не удалось обновить задачу'); throw error }
    return mapTask(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) handleError('Не удалось удалить задачу')
  },
}

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentsDb = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*')
    if (error) { handleError('Не удалось загрузить оплаты'); return [] }
    return (data ?? []).map(mapPayment)
  },
  async getByProject(projectId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('project_id', projectId)
    if (error) return []
    return (data ?? []).map(mapPayment)
  },
  async create(d: Omit<Payment, 'id'>): Promise<Payment> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('payments').insert({ user_id: uid, project_id: d.projectId, amount: d.amount, description: d.description, date: d.date, status: d.status }).select().single()
    if (error) { handleError('Не удалось создать оплату'); throw error }
    return mapPayment(data)
  },
  async update(id: string, d: Partial<Omit<Payment, 'id'>>): Promise<Payment> {
    const upd: Record<string, unknown> = {}
    if (d.projectId !== undefined) upd.project_id = d.projectId
    if (d.amount !== undefined) upd.amount = d.amount
    if (d.description !== undefined) upd.description = d.description
    if (d.date !== undefined) upd.date = d.date
    if (d.status !== undefined) upd.status = d.status
    const { data, error } = await supabase.from('payments').update(upd).eq('id', id).select().single()
    if (error) { handleError('Не удалось обновить оплату'); throw error }
    return mapPayment(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) handleError('Не удалось удалить оплату')
  },
}

// ─── Links ───────────────────────────────────────────────────────────────────

export const linksDb = {
  async getAll(): Promise<Link[]> {
    const { data, error } = await supabase.from('links').select('*')
    if (error) return []
    return (data ?? []).map(mapLink)
  },
  async getByProject(projectId: string): Promise<Link[]> {
    const { data, error } = await supabase.from('links').select('*').eq('project_id', projectId)
    if (error) return []
    return (data ?? []).map(mapLink)
  },
  async create(d: Omit<Link, 'id'>): Promise<Link> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('links').insert({ user_id: uid, project_id: d.projectId, label: d.label, url: d.url }).select().single()
    if (error) { handleError('Не удалось создать ссылку'); throw error }
    return mapLink(data)
  },
  async update(id: string, d: Partial<Omit<Link, 'id'>>): Promise<Link> {
    const upd: Record<string, unknown> = {}
    if (d.projectId !== undefined) upd.project_id = d.projectId
    if (d.label !== undefined) upd.label = d.label
    if (d.url !== undefined) upd.url = d.url
    const { data, error } = await supabase.from('links').update(upd).eq('id', id).select().single()
    if (error) { handleError('Не удалось обновить ссылку'); throw error }
    return mapLink(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) handleError('Не удалось удалить ссылку')
  },
}

// ─── Comments ────────────────────────────────────────────────────────────────

export const commentsDb = {
  async getAll(): Promise<Comment[]> {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []).map(mapComment)
  },
  async getByTask(taskId: string): Promise<Comment[]> {
    const { data, error } = await supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []).map(mapComment)
  },
  async create(d: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const uid = await getUserId()
    const { data, error } = await supabase.from('comments').insert({ user_id: uid, task_id: d.taskId, text: d.text, author: d.author }).select().single()
    if (error) { handleError('Не удалось создать комментарий'); throw error }
    return mapComment(data)
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) handleError('Не удалось удалить комментарий')
  },
}
