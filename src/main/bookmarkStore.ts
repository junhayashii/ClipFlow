import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { createHash } from 'crypto'

// ブックマークの保存ファイル名
const FILE_NAME = 'bookmarks.json'

export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}

function getFilePath(): string {
  // OSごとの userData 配下に保存
  return join(app.getPath('userData'), FILE_NAME)
}

function stableId(content: string): string {
  // content から安定した ID を作成（同じ内容は同じID）
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

export function loadBookmarks(): BookmarkItem[] {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return []

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    if (!Array.isArray(data)) return []

    // JSON の型チェック
    return data.filter(
      (v): v is BookmarkItem =>
        v != null &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.content === 'string' &&
        typeof v.timestamp === 'number'
    )
  } catch (e) {
    console.error('Failed to load bookmarks:', e)
    return []
  }
}

export function saveBookmarks(bookmarks: BookmarkItem[]): void {
  try {
    const filePath = getFilePath()
    // JSON で保存
    fs.writeFileSync(filePath, JSON.stringify(bookmarks, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save bookmarks:', e)
  }
}

export function addBookmark(bookmarks: BookmarkItem[], content: string, timestamp?: number): BookmarkItem[] {
  // 同じ content が既にある場合は追加しない
  const id = stableId(content)
  if (bookmarks.some((b) => b.id === id)) return bookmarks

  // 先頭に追加して保存
  const next: BookmarkItem = {
    id,
    content,
    timestamp: timestamp ?? Date.now()
  }
  const nextList = [next, ...bookmarks]
  saveBookmarks(nextList)
  return nextList
}

export function removeBookmark(bookmarks: BookmarkItem[], id: string): BookmarkItem[] {
  // ID で削除
  const next = bookmarks.filter((b) => b.id !== id)
  if (next.length === bookmarks.length) return bookmarks
  saveBookmarks(next)
  return next
}
