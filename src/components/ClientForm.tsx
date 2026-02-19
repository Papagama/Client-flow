import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Client, ClientStatus } from '../services/storageDb'

const schema = z.object({
  name: z.string().min(1, 'Введите имя'),
  contact: z.string().min(1, 'Введите контакт'),
  niche: z.string().min(1, 'Введите нишу'),
  status: z.enum(['lead', 'active', 'paused', 'done']),
})

type FormData = z.infer<typeof schema>

interface Props {
  client?: Client | null
  onSave: (data: FormData) => void
  onCancel: () => void
}

export default function ClientForm({ client, onSave, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? { name: client.name, contact: client.contact, niche: client.niche, status: client.status }
      : { name: '', contact: '', niche: '', status: 'lead' as ClientStatus },
  })

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400' : 'border-gray-300'}`

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
        <input {...register('name')} className={inputCls(errors.name?.message)} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Контакт</label>
        <input {...register('contact')} placeholder="Email или телефон" className={inputCls(errors.contact?.message)} />
        {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ниша</label>
        <input {...register('niche')} placeholder="напр. FinTech, Медицина" className={inputCls(errors.niche?.message)} />
        {errors.niche && <p className="text-xs text-red-500 mt-1">{errors.niche.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
        <select {...register('status')} className={inputCls()}>
          <option value="lead">Лид</option>
          <option value="active">В работе</option>
          <option value="paused">Пауза</option>
          <option value="done">Готово</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Отмена
        </button>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {client ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  )
}
