import { ReactNode } from 'react'
import { Sidebar } from '@renderer/components/Sidebar/Sidebar'
import { Page } from '@renderer/types'

export function MainLayout({
  children,
  onNavigate,
  current
}: {
  children: ReactNode
  onNavigate: (page: Page) => void
  current: Page
}) {
  return (
    <div className="h-screen w-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar current={current} onNavigate={onNavigate} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 p-6">{children}</main>
    </div>
  )
}
