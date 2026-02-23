import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsDb, type Client, type ClientStatus } from '../services/storageDb'
import Modal from '../components/Modal'
import ClientForm from '../components/ClientForm'
import { useToast } from '../shared/ui/Toast'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const STATUS_OPTIONS: { value: ClientStatus | ''; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'lead', label: 'Лид' },
  { value: 'active', label: 'В работе' },
  { value: 'paused', label: 'Пауза' },
  { value: 'done', label: 'Готово' },
]

const STATUS_COLORS: Record<ClientStatus, string> = {
  lead: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-600',
  done: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Лид',
  active: 'В работе',
  paused: 'Пауза',
  done: 'Готово',
}

export default function Clients() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  const refresh = useCallback(() => {
    clientsDb.getAll().then(setClients)
  }, [])

  useEffect(() => {
    clientsDb.getAll().then(data => { setClients(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.niche.toLowerCase().includes(q)
      const matchStatus = !statusFilter || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [clients, search, statusFilter])

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Client) { setEditing(c); setModalOpen(true) }

  async function handleSave(data: { name: string; contact: string; niche: string; status: ClientStatus }) {
    try {
      if (editing) {
        await clientsDb.update(editing.id, data)
        toast('Клиент обновлён')
      } else {
        await clientsDb.create(data)
        toast('Клиент создан')
      }
      refresh()
      setModalOpen(false)
    } catch {
      toast('Не удалось сохранить', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await clientsDb.delete(id)
      refresh()
      toast('Клиент удалён')
    } catch {
      toast('Не удалось удалить', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input placeholder="Поиск по имени, контакту, нише…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ClientStatus | '')}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-400">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Добавить клиента
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : clients.length === 0 ? (
        <EmptyState icon="👥" title="Клиентов пока нет" description="Добавьте первого клиента" actionLabel="+ Добавить клиента" onAction={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow-sm text-center text-gray-400">Ничего не найдено</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3">Имя</th>
                <th className="px-5 py-3">Контакт</th>
                <th className="px-5 py-3">Ниша</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer" onClick={() => navigate(`/app/clients/${c.id}`)}>{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.contact}</td>
                  <td className="px-5 py-3 text-gray-600">{c.niche}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Изменить</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать клиента' : 'Новый клиент'}>
        <ClientForm key={editing?.id ?? 'new'} client={editing} onSave={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
