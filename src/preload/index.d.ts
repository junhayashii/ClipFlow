import { ElectronAPI } from '@electron-toolkit/preload'

export type ClipboardItem =
  | { id: string; type: 'text'; content: string; timestamp: number }
  | {
      id: string
      type: 'image'
      dataUrl: string
      width: number
      height: number
      filename?: string
      timestamp: number
    }

// クリップボード API（preload 経由で renderer から利用）
export interface ClipboardApi {
  readText(): Promise<string>
  onChange(callback: (text: string) => void): void
  onHistory(callback: (history: ClipboardItem[]) => void): void
  writeText(text: string): Promise<void>
  writeImage(dataUrl: string, filename?: string): Promise<void>
  removeFromHistory(id: string): Promise<ClipboardItem[]>
}

// アプリ設定
export interface Settings {
  enableTray: boolean
  darkMode: boolean
}

// 設定 API
export interface SettingsApi {
  get(): Promise<Settings>
  update(partial: Partial<Settings>): Promise<Settings>
}

// ブックマークの単位
export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}

// ブックマーク API
export interface BookmarkApi {
  get(): Promise<BookmarkItem[]>
  add(content: string, timestamp?: number): Promise<BookmarkItem[]>
  remove(id: string): Promise<BookmarkItem[]>
  onBookmarks(callback: (bookmarks: BookmarkItem[]) => void): () => void
}

// 統計データ（レンダラーで表示する形）
export interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
}

// 統計 API
export interface StatisticsApi {
  get(): Promise<Statistics>
}

declare global {
  interface Window {
    // electron-toolkit 由来の API
    electron: ElectronAPI
    api: unknown
    // preload で公開する各 API
    clipboardApi: ClipboardApi
    settingsApi: SettingsApi
    bookmarkApi: BookmarkApi
    statisticsApi: StatisticsApi
  }
}
