export type Page = 'history' | 'bookmark' | 'statistics' | 'settings'

export interface ClipboardItem {
  id: string
  content: string
  timestamp: number
}

export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}
