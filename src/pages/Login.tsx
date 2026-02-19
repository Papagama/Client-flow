import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

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

function getUsers(): { name: string; email: string; password: string }[] {
  try { return JSON.parse(localStorage.getItem('app_users') ?? '[]') } catch { return [] }
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setTimeout(() => {
      const users = getUsers()
      const user = users.find(u => u.email === form.email)

      if (user && user.password && user.password !== form.password) {
        setErrors({ general: 'Неверный пароль' })
        setLoading(false)
        return
      }

      // Save profile if registered user
      if (user) {
        localStorage.setItem('profile_name', user.name)
        localStorage.setItem('profile_email', user.email)
      }

      localStorage.setItem('token', 'user-token-' + btoa(form.email))
      navigate('/app/dashboard', { replace: true })
    }, 600)
  }

  function handleDemo() {
    localStorage.setItem('token', 'demo-token')
    localStorage.setItem('profile_name', 'Демо')
    localStorage.setItem('profile_email', 'demo@clientflow.app')
    navigate('/app/dashboard', { replace: true })
  }

  function handleGoogle() {
    setLoading(true)
    setTimeout(() => {
      const gName = 'Google User'
      const gEmail = 'user@gmail.com'
      const users = getUsers()
      if (!users.some(u => u.email === gEmail)) {
        users.push({ name: gName, email: gEmail, password: '' })
        localStorage.setItem('app_users', JSON.stringify(users))
      }
      localStorage.setItem('token', 'google-token-' + Date.now())
      localStorage.setItem('profile_name', gName)
      localStorage.setItem('profile_email', gEmail)
      navigate('/app/dashboard', { replace: true })
    }, 1000)
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
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-lg transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </button>

          <button onClick={handleDemo} disabled={loading}
            className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 text-gray-700 dark:text-gray-200 text-sm font-medium py-2.5 rounded-lg transition">
            🚀 Демо-вход
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
