import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

const FILE_NAME = 'clipboard-history.json'
const MAX_HISTORY = 20

function getFilePath() {
  return join(app.getPath('userData'), FILE_NAME)
}

export function loadHistory(): string[] {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return []

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    if (Array.isArray(data)) {
      return data.filter((v) => typeof v === 'string')
    }
    return []
  } catch (e) {
    console.error('Failed to load history:', e)
    return []
  }
}

export function saveHistory(history: string[]) {
  try {
    const filePath = getFilePath()
    const sliced = history.slice(0, MAX_HISTORY)
    fs.writeFileSync(filePath, JSON.stringify(sliced, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}
