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
  deadline: string          // ISO date string (YYYY-MM-DD)
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function now(): string {
  return new Date().toISOString()
}

function daysFromNow(d: number): string {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date.toISOString().slice(0, 10)
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    const msg = e instanceof DOMException && e.name === 'QuotaExceededError'
      ? 'Хранилище заполнено. Удалите часть данных.'
      : 'Не удалось сохранить данные.'
    storageDb.onError?.(msg)
    throw new Error(msg)
  }
}

// ─── Error hook ──────────────────────────────────────────────────────────────

export const storageDb = {
  onError: null as ((msg: string) => void) | null,
}

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  clients: 'db_clients',
  projects: 'db_projects',
  tasks: 'db_tasks',
  payments: 'db_payments',
  links: 'db_links',
  comments: 'db_comments',
  seeded: 'db_seeded',
}

// ─── Seed ────────────────────────────────────────────────────────────────────

function seed(): void {
  if (localStorage.getItem(KEYS.seeded)) return

  const clients: Client[] = [
    { id: uid(), name: 'Alice Johnson', contact: 'alice@acme.com', niche: 'E-commerce', status: 'active', createdAt: now() },
    { id: uid(), name: 'Bob Smith', contact: 'bob@globex.com', niche: 'FinTech', status: 'lead', createdAt: now() },
    { id: uid(), name: 'Carol White', contact: 'carol@initech.com', niche: 'Healthcare', status: 'paused', createdAt: now() },
  ]

  const projects: Project[] = [
    { id: uid(), clientId: clients[0].id, title: 'Website Redesign', stage: 'development', deadline: daysFromNow(5), budget: 12000, status: 'active', createdAt: now() },
    { id: uid(), clientId: clients[0].id, title: 'Mobile App', stage: 'brief', deadline: daysFromNow(30), budget: 45000, status: 'on-hold', createdAt: now() },
    { id: uid(), clientId: clients[1].id, title: 'CRM Integration', stage: 'revisions', deadline: daysFromNow(-3), budget: 8500, status: 'active', createdAt: now() },
    { id: uid(), clientId: clients[2].id, title: 'Analytics Dashboard', stage: 'delivery', deadline: daysFromNow(-10), budget: 20000, status: 'completed', createdAt: now() },
    { id: uid(), clientId: clients[1].id, title: 'Payment Gateway', stage: 'design', deadline: daysFromNow(2), budget: 15000, status: 'active', createdAt: now() },
  ]

  const tasks: Task[] = [
    { id: uid(), projectId: projects[0].id, title: 'Design mockups', description: 'Create wireframes and high-fidelity mockups in Figma', status: 'done', dueDate: daysFromNow(-5), priority: 'high', createdAt: now() },
    { id: uid(), projectId: projects[0].id, title: 'Frontend implementation', description: 'Build React components based on approved designs', status: 'doing', dueDate: daysFromNow(3), priority: 'high', createdAt: now() },
    { id: uid(), projectId: projects[0].id, title: 'QA testing', description: 'Run full regression test suite', status: 'todo', dueDate: daysFromNow(7), priority: 'medium', createdAt: now() },
    { id: uid(), projectId: projects[2].id, title: 'API mapping', description: 'Map CRM endpoints to internal data model', status: 'doing', dueDate: daysFromNow(1), priority: 'high', createdAt: now() },
    { id: uid(), projectId: projects[2].id, title: 'Data migration', description: 'Migrate legacy data to new schema', status: 'todo', dueDate: daysFromNow(10), priority: 'low', createdAt: now() },
    { id: uid(), projectId: projects[3].id, title: 'Chart components', description: 'Build reusable chart components with D3', status: 'done', dueDate: daysFromNow(-12), priority: 'medium', createdAt: now() },
  ]

  save(KEYS.clients, clients)
  save(KEYS.projects, projects)
  save(KEYS.tasks, tasks)

  const payments: Payment[] = [
    { id: uid(), projectId: projects[0].id, amount: 4000, description: 'Design phase', date: daysFromNow(-15), status: 'paid' },
    { id: uid(), projectId: projects[0].id, amount: 5000, description: 'Development milestone 1', date: daysFromNow(-2), status: 'partial' },
    { id: uid(), projectId: projects[0].id, amount: 3000, description: 'Final delivery', date: daysFromNow(10), status: 'unpaid' },
    { id: uid(), projectId: projects[2].id, amount: 8500, description: 'Full payment', date: daysFromNow(-5), status: 'unpaid' },
    { id: uid(), projectId: projects[4].id, amount: 7500, description: 'Upfront deposit', date: daysFromNow(-1), status: 'paid' },
  ]

  const links: Link[] = [
    { id: uid(), projectId: projects[0].id, label: 'Figma mockups', url: 'https://figma.com/file/example' },
    { id: uid(), projectId: projects[0].id, label: 'GitHub repo', url: 'https://github.com/example/website' },
    { id: uid(), projectId: projects[2].id, label: 'API docs', url: 'https://docs.example.com/crm' },
  ]

  const comments: Comment[] = [
    { id: uid(), taskId: tasks[0].id, text: 'Макеты утверждены клиентом', author: 'Админ', createdAt: now() },
    { id: uid(), taskId: tasks[1].id, text: 'Начал работу над компонентами', author: 'Админ', createdAt: now() },
    { id: uid(), taskId: tasks[3].id, text: 'Нужно уточнить формат данных', author: 'Админ', createdAt: now() },
  ]

  save(KEYS.payments, payments)
  save(KEYS.links, links)
  save(KEYS.comments, comments)
  localStorage.setItem(KEYS.seeded, '1')
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsDb = {
  getAll(): Client[] {
    return load<Client>(KEYS.clients)
  },
  getById(id: string): Client | undefined {
    return this.getAll().find(c => c.id === id)
  },
  create(data: Omit<Client, 'id' | 'createdAt'>): Client {
    const item: Client = { ...data, id: uid(), createdAt: now() }
    save(KEYS.clients, [...this.getAll(), item])
    return item
  },
  update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Client {
    const all = this.getAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Client ${id} not found`)
    all[idx] = { ...all[idx], ...data }
    save(KEYS.clients, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.clients, this.getAll().filter(c => c.id !== id))
  },
}

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsDb = {
  getAll(): Project[] {
    return load<Project>(KEYS.projects)
  },
  getById(id: string): Project | undefined {
    return this.getAll().find(p => p.id === id)
  },
  getByClient(clientId: string): Project[] {
    return this.getAll().filter(p => p.clientId === clientId)
  },
  create(data: Omit<Project, 'id' | 'createdAt'>): Project {
    const item: Project = { ...data, id: uid(), createdAt: now() }
    save(KEYS.projects, [...this.getAll(), item])
    return item
  },
  update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Project {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    all[idx] = { ...all[idx], ...data }
    save(KEYS.projects, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.projects, this.getAll().filter(p => p.id !== id))
  },
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksDb = {
  getAll(): Task[] {
    return load<Task>(KEYS.tasks)
  },
  getById(id: string): Task | undefined {
    return this.getAll().find(t => t.id === id)
  },
  getByProject(projectId: string): Task[] {
    return this.getAll().filter(t => t.projectId === projectId)
  },
  create(data: Omit<Task, 'id' | 'createdAt'>): Task {
    const item: Task = { ...data, id: uid(), createdAt: now() }
    save(KEYS.tasks, [...this.getAll(), item])
    return item
  },
  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
    const all = this.getAll()
    const idx = all.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Task ${id} not found`)
    all[idx] = { ...all[idx], ...data }
    save(KEYS.tasks, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.tasks, this.getAll().filter(t => t.id !== id))
  },
}

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentsDb = {
  getAll(): Payment[] {
    return load<Payment>(KEYS.payments)
  },
  getByProject(projectId: string): Payment[] {
    return this.getAll().filter(p => p.projectId === projectId)
  },
  create(data: Omit<Payment, 'id'>): Payment {
    const item: Payment = { ...data, id: uid() }
    save(KEYS.payments, [...this.getAll(), item])
    return item
  },
  update(id: string, data: Partial<Omit<Payment, 'id'>>): Payment {
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Payment ${id} not found`)
    all[idx] = { ...all[idx], ...data }
    save(KEYS.payments, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.payments, this.getAll().filter(p => p.id !== id))
  },
}

// ─── Links ───────────────────────────────────────────────────────────────────

export const linksDb = {
  getAll(): Link[] {
    return load<Link>(KEYS.links)
  },
  getByProject(projectId: string): Link[] {
    return this.getAll().filter(l => l.projectId === projectId)
  },
  create(data: Omit<Link, 'id'>): Link {
    const item: Link = { ...data, id: uid() }
    save(KEYS.links, [...this.getAll(), item])
    return item
  },
  update(id: string, data: Partial<Omit<Link, 'id'>>): Link {
    const all = this.getAll()
    const idx = all.findIndex(l => l.id === id)
    if (idx === -1) throw new Error(`Link ${id} not found`)
    all[idx] = { ...all[idx], ...data }
    save(KEYS.links, all)
    return all[idx]
  },
  delete(id: string): void {
    save(KEYS.links, this.getAll().filter(l => l.id !== id))
  },
}

// ─── Comments ────────────────────────────────────────────────────────────────

export const commentsDb = {
  getAll(): Comment[] {
    return load<Comment>(KEYS.comments)
  },
  getByTask(taskId: string): Comment[] {
    return this.getAll().filter(c => c.taskId === taskId)
  },
  create(data: Omit<Comment, 'id' | 'createdAt'>): Comment {
    const item: Comment = { ...data, id: uid(), createdAt: now() }
    save(KEYS.comments, [...this.getAll(), item])
    return item
  },
  delete(id: string): void {
    save(KEYS.comments, this.getAll().filter(c => c.id !== id))
  },
}

// ─── Init ────────────────────────────────────────────────────────────────────

seed()
