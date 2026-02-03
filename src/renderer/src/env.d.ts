export {}

declare global {
  interface ClipboardApi {
    readText: () => Promise<string>
    writeText: (text: string) => Promise<void>
    getHistory: () => Promise<string[]>
    onHistory: (callback: (history: string[]) => void) => () => void
    removeFromHistory: (content: string) => Promise<string[]>
  }

  interface Window {
    clipboardApi: ClipboardApi
    settingsApi: {
      get: () => Promise<{ enableTray: boolean; darkMode: boolean }>
      update: (partial: { enableTray?: boolean; darkMode?: boolean }) => Promise<{ enableTray: boolean; darkMode: boolean }>
    }
    bookmarkApi: {
      get: () => Promise<{ id: string; content: string; timestamp: number }[]>
      add: (content: string, timestamp?: number) => Promise<{ id: string; content: string; timestamp: number }[]>
      remove: (id: string) => Promise<{ id: string; content: string; timestamp: number }[]>
      onBookmarks: (callback: (bookmarks: { id: string; content: string; timestamp: number }[]) => void) => () => void
    }
    statisticsApi: {
      get: () => Promise<{
        totalCopy: number
        totalPaste: number
        daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
        weekly: Array<{ period: string; copy: number; paste: number }>
        monthly: Array<{ period: string; copy: number; paste: number }>
      }>
    }
  }
}
