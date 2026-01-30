import { useState, useEffect } from 'react'
import { MainLayout } from './layouts/MainLayout'
import HistoryPage from './pages/HistoryPage'
import BookmarkPage from './pages/BookmarkPage'
import SettingsPage from './pages/SettingsPage'
import type { Page } from './types'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('history')
  const [history, setHistory] = useState<string[]>([])
  const [enableTray, setEnableTray] = useState(true)

  useEffect(() => {
    window.clipboardApi.onHistory(setHistory)
    window.settingsApi.get().then((s) => setEnableTray(s.enableTray))
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
        <HistoryPage history={history} onSelect={(text) => window.clipboardApi.writeText(text)} />
      )}

      {page === 'bookmark' && <BookmarkPage />}
      {page === 'settings' && <SettingsPage />}
    </MainLayout>
  )
}

export default App
