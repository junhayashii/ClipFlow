import { LucideIcon } from 'lucide-react'

export function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
        ${
          active
            ? 'bg-sky-500 text-white shadow'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )
}
