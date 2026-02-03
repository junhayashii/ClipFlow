import { History, Bookmark, BarChart3, Settings, ClipboardIcon } from 'lucide-react'
import type { Page } from '../../types'
import { SidebarItem } from './SidebarItem'

export function Sidebar({
  current,
  onNavigate
}: {
  current: Page
  onNavigate: (page: Page) => void
}) {
  return (
    <aside className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col py-6">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
          <ClipboardIcon />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-slate-100">ClipFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3">
        <SidebarItem
          icon={History}
          label="History"
          active={current === 'history'}
          onClick={() => onNavigate('history')}
        />
        <SidebarItem
          icon={Bookmark}
          label="Bookmarks"
          active={current === 'bookmark'}
          onClick={() => onNavigate('bookmark')}
        />
        <SidebarItem
          icon={BarChart3}
          label="Statistics"
          active={current === 'statistics'}
          onClick={() => onNavigate('statistics')}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          active={current === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </nav>

      <div className="mt-auto px-6 text-xs text-slate-400 dark:text-slate-500">Cmd + Shift + V</div>
    </aside>
  )
}
