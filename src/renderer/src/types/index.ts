// 画面のルーティング種別
export type Page = 'history' | 'bookmark' | 'statistics' | 'settings'

// 履歴のアイテム型（テキスト or 画像）
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

// ブックマークのアイテム型
export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}
