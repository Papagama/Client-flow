import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastCtx {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

let nextId = 0

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type, action }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

// ─── Config ──────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-700',
}

const DURATION = 5000
const EXIT_MS = 300

// ─── Single toast ────────────────────────────────────────────────────────────

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => setExiting(true), item.action ? DURATION : 3000)
    return () => clearTimeout(timerRef.current)
  }, [item.action])

  useEffect(() => {
    if (!exiting) return
    const t = setTimeout(onDone, EXIT_MS)
    return () => clearTimeout(t)
  }, [exiting, onDone])

  function dismiss() {
    clearTimeout(timerRef.current)
    setExiting(true)
  }

  function handleAction() {
    item.action?.onClick()
    dismiss()
  }

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg
        text-white text-sm ${COLORS[item.type]}
        transition-all duration-300 ease-out
        ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      style={{ animation: exiting ? undefined : 'toast-in 0.3s ease-out' }}
    >
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
        {ICONS[item.type]}
      </span>
      <span className="cursor-pointer" onClick={dismiss}>{item.message}</span>
      {item.action && (
        <button
          onClick={handleAction}
          className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-semibold transition shrink-0"
        >
          {item.action.label}
        </button>
      )}
    </div>
  )
}
