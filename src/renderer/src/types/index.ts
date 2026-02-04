export type Page = 'history' | 'bookmark' | 'statistics' | 'settings'

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

export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}
