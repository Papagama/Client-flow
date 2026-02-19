interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm py-16 px-6 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
