import { useState, useEffect } from 'react'
import { MainLayout } from './layouts/MainLayout'
import HistoryPage from './pages/HistoryPage'
import BookmarkPage from './pages/BookmarkPage'
import SettingsPage from './pages/SettingsPage'
import type { ClipboardItem, Page } from './types'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('history')
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [enableTray, setEnableTray] = useState(true)

  useEffect(() => {
    // ① 初期履歴を1回取得
    window.clipboardApi.getHistory().then((items: string[]) => {
      setHistory(
        items.map((content, i) => ({
          id: `${Date.now()}-${i}`,
          content,
          timestamp: Date.now()
        }))
      )
    })

    // ② 変更を購読
    const unsubscribe = window.clipboardApi.onHistory((items: string[]) => {
      setHistory(
        items.map((content, i) => ({
          id: `${Date.now()}-${i}`,
          content,
          timestamp: Date.now()
        }))
      )
    })

    // ③ settings
    window.settingsApi.get().then((s) => setEnableTray(s.enableTray))

    // ④ cleanup（超重要）
    return () => {
      unsubscribe?.()
    }
  }, [])

  const toggleTray = async () => {
    const updated = await window.settingsApi.update({
      enableTray: !enableTray
    })
    setEnableTray(updated.enableTray)
  }

  return (
    <MainLayout current={page} onNavigate={setPage}>
      {page === 'history' && (
        <HistoryPage items={history} onCopy={(text) => window.clipboardApi.writeText(text)} />
      )}
      {page === 'bookmark' && <BookmarkPage />}
      {page === 'settings' && <SettingsPage enableTray={enableTray} onToggleTray={toggleTray} />}
    </MainLayout>
  )
}

export default App
