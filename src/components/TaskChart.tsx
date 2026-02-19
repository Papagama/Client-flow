import { useMemo } from 'react'
import type { Task } from '../services/storageDb'

interface Props {
  tasks: Task[]
}

export default function TaskChart({ tasks }: Props) {
  const data = useMemo(() => {
    const days: { label: string; done: number; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('ru-RU', { weekday: 'short' })
      const dayTasks = tasks.filter(t => t.dueDate === iso)
      const done = dayTasks.filter(t => t.status === 'done').length
      days.push({ label, done, total: dayTasks.length })
    }
    return days
  }, [tasks])

  const max = Math.max(...data.map(d => d.total), 1)
  const barW = 32
  const gap = 12
  const chartH = 120
  const chartW = data.length * (barW + gap) - gap
  const padTop = 20
  const padBottom = 24
  const svgH = chartH + padTop + padBottom
  const svgW = chartW + 20

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Задачи за неделю</h2>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 200 }}>
        {data.map((d, i) => {
          const x = 10 + i * (barW + gap)
          const totalH = (d.total / max) * chartH
          const doneH = (d.done / max) * chartH
          const yTotal = padTop + chartH - totalH
          const yDone = padTop + chartH - doneH

          return (
            <g key={i}>
              {/* Total bar */}
              <rect x={x} y={yTotal} width={barW} height={totalH || 2} rx={4} fill="#e0e7ff" />
              {/* Done bar */}
              <rect x={x} y={yDone} width={barW} height={doneH || 0} rx={4} fill="#6366f1" />
              {/* Count label */}
              {d.total > 0 && (
                <text x={x + barW / 2} y={yTotal - 4} textAnchor="middle" className="text-[10px] fill-gray-400">{d.done}/{d.total}</text>
              )}
              {/* Day label */}
              <text x={x + barW / 2} y={svgH - 4} textAnchor="middle" className="text-[10px] fill-gray-400 capitalize">{d.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Выполнено</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 inline-block" /> Всего</span>
      </div>
    </div>
  )
}
