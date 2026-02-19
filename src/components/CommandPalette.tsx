import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsDb, projectsDb, tasksDb } from '../services/storageDb'

type ResultType = 'client' | 'project' | 'task'

interface Result {
  type: ResultType
  label: string
  sub: string
  path: string
}

const TYPE_META: Record<ResultType, { icon: JSX.Element; label: string; color: string }> = {
  client: {
    label: 'Клиенты',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  project: {
    label: 'Проекты',
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  task: {
    label: 'Задачи',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

const TASK_STATUS_LABELS: Record<string, string> = { todo: 'К выполнению', doing: 'В процессе', done: 'Готово' }

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const r: Result[] = []

    clientsDb.getAll().forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q))
        r.push({ type: 'client', label: c.name, sub: c.niche, path: `/app/clients/${c.id}` })
    })
    projectsDb.getAll().forEach(p => {
      if (p.title.toLowerCase().includes(q))
        r.push({ type: 'project', label: p.title, sub: `$${p.budget.toLocaleString()}`, path: `/app/projects/${p.id}` })
    })
    tasksDb.getAll().forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        r.push({ type: 'task', label: t.title, sub: TASK_STATUS_LABELS[t.status] ?? t.status, path: `/app/projects/${t.projectId}` })
    })

    return r.slice(0, 12)
  }, [query])

  // Group results by type
  const grouped = useMemo(() => {
    const map = new Map<ResultType, Result[]>()
    results.forEach(r => {
      if (!map.has(r.type)) map.set(r.type, [])
      map.get(r.type)!.push(r)
    })
    return map
  }, [results])

  // Flat index for keyboard nav
  const flatResults = useMemo(() => {
    const flat: Result[] = []
    ;(['client', 'project', 'task'] as ResultType[]).forEach(type => {
      const items = grouped.get(type)
      if (items) flat.push(...items)
    })
    return flat
  }, [grouped])

  const go = useCallback((path: string) => {
    navigate(path)
    setOpen(false)
  }, [navigate])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && flatResults[selected]) { go(flatResults[selected].path) }
  }

  if (!open) return null

  let flatIdx = -1

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden animate-[slideDown_200ms_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            placeholder="Поиск клиентов, проектов, задач…"
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto overscroll-contain">
          {query.trim() && flatResults.length === 0 && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
              <p className="text-sm">Ничего не найдено</p>
              <p className="text-xs mt-0.5">Попробуйте другой запрос</p>
            </div>
          )}

          {!query.trim() && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <p className="text-sm">Быстрый поиск</p>
              <p className="text-xs mt-0.5">Клиенты, проекты и задачи</p>
            </div>
          )}

          {(['client', 'project', 'task'] as ResultType[]).map(type => {
            const items = grouped.get(type)
            if (!items) return null
            const meta = TYPE_META[type]
            return (
              <div key={type}>
                <div className="px-5 pt-3 pb-1.5 flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center ${meta.color}`}>{meta.icon}</span>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{meta.label}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">({items.length})</span>
                </div>
                {items.map((r, i) => {
                  flatIdx++
                  const idx = flatIdx
                  const isSelected = idx === selected
                  return (
                    <button
                      key={r.path + r.label + i}
                      data-idx={idx}
                      onClick={() => go(r.path)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800/40 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{highlightMatch(r.label, query)}</p>
                        <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                          <kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">↵</kbd>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/80">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-[10px]">↑↓</kbd>
            навигация
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-[10px]">↵</kbd>
            открыть
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <kbd className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-[10px]">esc</kbd>
            закрыть
          </span>
        </div>
      </div>
    </div>
  )
}
