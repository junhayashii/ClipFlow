import { ElectronAPI } from '@electron-toolkit/preload'

export interface ClipboardApi {
  readText(): Promise<string>
  onChange(callback: (text: string) => void): void
  onHistory(callback: (history: string[]) => void): void
  writeText(text: string): Promise<void>
  removeFromHistory(content: string): Promise<string[]>
}

export interface Settings {
  enableTray: boolean
}

export interface SettingsApi {
  get(): Promise<Settings>
  update(partial: Partial<Settings>): Promise<Settings>
}

export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}

export interface BookmarkApi {
  get(): Promise<BookmarkItem[]>
  add(content: string, timestamp?: number): Promise<BookmarkItem[]>
  remove(id: string): Promise<BookmarkItem[]>
  onBookmarks(callback: (bookmarks: BookmarkItem[]) => void): () => void
}

export interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
}

export interface StatisticsApi {
  get(): Promise<Statistics>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    clipboardApi: ClipboardApi
    settingsApi: SettingsApi
    bookmarkApi: BookmarkApi
    statisticsApi: StatisticsApi
  }
}
