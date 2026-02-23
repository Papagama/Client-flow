import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

interface FormState { email: string; password: string }
interface Errors { email?: string; password?: string; general?: string }

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (!form.email) errors.email = 'Введите email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Некорректный email'
  if (!form.password) errors.password = 'Введите пароль'
  else if (form.password.length < 6) errors.password = 'Минимум 6 символов'
  return errors
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined, general: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (error) {
      setErrors({ general: error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message })
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
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">С возвращением</h1>
            <p className="text-xs text-gray-400">Войдите в ClientFlow</p>
          </div>
        </div>

        {errors.general && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls(errors.email)} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Пароль</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} placeholder="••••••••" className={inputCls(errors.password)} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition">
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
          <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-400">или</span></div>
        </div>

        <div className="space-y-2.5">
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
