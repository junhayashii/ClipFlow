import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import type { ClipboardItem } from './clipboardTypes'

// 履歴の保存ファイル名（userData 配下）
const FILE_NAME = 'clipboard-history.json'
// 保存する最大件数
const MAX_HISTORY = 20

function getFilePath() {
  // OSごとの userData 配下に保存
  return join(app.getPath('userData'), FILE_NAME)
}

// JSON から読み込んだ値が ClipboardItem として妥当かをチェック
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
      // 旧形式（string 配列）の場合は text アイテムに変換して読み込む
      if (data.every((v) => typeof v === 'string')) {
        const now = Date.now()
        return data.map((content, i) => ({
          id: `legacy-${now}-${i}`,
          type: 'text',
          content,
          timestamp: now - i
        }))
      }
      // 新形式（オブジェクト配列）の場合は妥当性チェックして返す
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
    // 最大件数を超えないように保存
    const sliced = history.slice(0, MAX_HISTORY)
    fs.writeFileSync(filePath, JSON.stringify(sliced, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}
