export type Page = 'history' | 'bookmark' | 'settings'

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
