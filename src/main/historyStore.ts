import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import type { ClipboardItem } from './clipboardTypes'

const FILE_NAME = 'clipboard-history.json'
const MAX_HISTORY = 20

function getFilePath() {
  return join(app.getPath('userData'), FILE_NAME)
}

function isClipboardItem(value: unknown): value is ClipboardItem {
  if (!value || typeof value !== 'object') return false
  const item = value as ClipboardItem
  if (item.type === 'text') {
    return (
      typeof item.id === 'string' &&
      typeof item.content === 'string' &&
      typeof item.timestamp === 'number'
    )
  }
  if (item.type === 'image') {
    return (
      typeof item.id === 'string' &&
      typeof item.dataUrl === 'string' &&
      typeof item.width === 'number' &&
      typeof item.height === 'number' &&
      (item.filename === undefined || typeof item.filename === 'string') &&
      typeof item.timestamp === 'number'
    )
  }
  return false
}

export function loadHistory(): ClipboardItem[] {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return []

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    if (Array.isArray(data)) {
      if (data.every((v) => typeof v === 'string')) {
        const now = Date.now()
        return data.map((content, i) => ({
          id: `legacy-${now}-${i}`,
          type: 'text',
          content,
          timestamp: now - i
        }))
      }
      return data.filter(isClipboardItem)
    }
    return []
  } catch (e) {
    console.error('Failed to load history:', e)
    return []
  }
}

export function saveHistory(history: ClipboardItem[]) {
  try {
    const filePath = getFilePath()
    const sliced = history.slice(0, MAX_HISTORY)
    fs.writeFileSync(filePath, JSON.stringify(sliced, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}
