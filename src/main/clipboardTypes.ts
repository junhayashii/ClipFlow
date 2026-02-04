export type ClipboardItem = TextClipboardItem | ImageClipboardItem

export interface TextClipboardItem {
  id: string
  type: 'text'
  content: string
  timestamp: number
}

export interface ImageClipboardItem {
  id: string
  type: 'image'
  dataUrl: string
  width: number
  height: number
  filename?: string
  timestamp: number
}

export function isSameClipboardItem(a: ClipboardItem, b: ClipboardItem): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text') return a.content === b.content
  return a.dataUrl === b.dataUrl
}
