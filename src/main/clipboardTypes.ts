// 履歴に保存するクリップボードアイテムの共通型
export type ClipboardItem = TextClipboardItem | ImageClipboardItem

// テキストの履歴アイテム
export interface TextClipboardItem {
  id: string
  type: 'text'
  content: string
  timestamp: number
}

// 画像の履歴アイテム（dataUrl でプレビュー表示できる形にしている）
export interface ImageClipboardItem {
  id: string
  type: 'image'
  dataUrl: string
  width: number
  height: number
  // 画像ファイルがある場合はファイル名。ない場合は自動生成名。
  filename?: string
  timestamp: number
}

// 同じ内容かどうかを判定（履歴の重複除外に使用）
export function isSameClipboardItem(a: ClipboardItem, b: ClipboardItem): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text') return a.content === b.content
  return a.dataUrl === b.dataUrl
}
