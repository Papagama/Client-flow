import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

interface FormState { name: string; email: string; password: string; confirm: string }
interface Errors { name?: string; email?: string; password?: string; confirm?: string; general?: string }

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.name.trim()) e.name = 'Введите имя'
  if (!f.email) e.email = 'Введите email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Некорректный email'
  if (!f.password) e.password = 'Введите пароль'
  else if (f.password.length < 6) e.password = 'Минимум 6 символов'
  if (!f.confirm) e.confirm = 'Подтвердите пароль'
  else if (f.password !== f.confirm) e.confirm = 'Пароли не совпадают'
  return e
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: undefined, general: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name.trim() } },
    })
    setLoading(false)

    if (error) {
      setErrors({ general: error.message })
      return
    }
    navigate('/app/dashboard', { replace: true })
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2 focus:ring-indigo-400 ${err ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'}`

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">C</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Регистрация</h1>
            <p className="text-xs text-gray-400">Создайте аккаунт ClientFlow</p>
          </div>
        </div>

        {errors.general && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-name">Имя</label>
            <input id="reg-name" name="name" autoComplete="name" value={form.name} onChange={handleChange} placeholder="Ваше имя" className={inputCls(errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-email">Email</label>
            <input id="reg-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls(errors.email)} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-password">Пароль</label>
            <input id="reg-password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="••••••••" className={inputCls(errors.password)} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-confirm">Подтвердите пароль</label>
            <input id="reg-confirm" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={handleChange} placeholder="••••••••" className={inputCls(errors.confirm)} />
            {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition mt-1">
            {loading ? 'Создание…' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Войти</Link>
        </p>
      </div>
    </div>
  )
}
