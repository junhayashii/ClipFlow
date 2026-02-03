import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { createHash } from 'crypto'

const FILE_NAME = 'bookmarks.json'

export interface BookmarkItem {
  id: string
  content: string
  timestamp: number
}

function getFilePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

function stableId(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

export function loadBookmarks(): BookmarkItem[] {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return []

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    if (!Array.isArray(data)) return []

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
    fs.writeFileSync(filePath, JSON.stringify(bookmarks, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save bookmarks:', e)
  }
}

export function addBookmark(bookmarks: BookmarkItem[], content: string, timestamp?: number): BookmarkItem[] {
  const id = stableId(content)
  if (bookmarks.some((b) => b.id === id)) return bookmarks

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
  const next = bookmarks.filter((b) => b.id !== id)
  if (next.length === bookmarks.length) return bookmarks
  saveBookmarks(next)
  return next
}
