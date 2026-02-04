import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

// 設定の保存ファイル名
const FILE_NAME = 'settings.json'

// 設定項目の型
export type Settings = {
  enableTray: boolean
  darkMode: boolean
}

// 初期値
const defaults: Settings = {
  enableTray: true,
  darkMode: false
}

// メモリ上の現在設定
let settings: Settings = { ...defaults }

function getFilePath(): string {
  // OSごとの userData 配下に保存
  return join(app.getPath('userData'), FILE_NAME)
}

export function loadSettings(): Settings {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return { ...defaults }

    // JSON を読み込んで存在する項目だけ反映
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as Partial<Settings>
    return {
      enableTray: typeof data.enableTray === 'boolean' ? data.enableTray : defaults.enableTray,
      darkMode: typeof data.darkMode === 'boolean' ? data.darkMode : defaults.darkMode
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
    return { ...defaults }
  }
}

function saveSettings(): void {
  try {
    const filePath = getFilePath()
    // JSON で保存
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function getSettings(): Settings {
  // 現在の設定値を返す
  return settings
}

/** app ready 後に呼ぶ（userData が使えるようになってから） */
export function initSettings(): void {
  // 起動時にファイルから読み込んで初期化
  settings = loadSettings()
}

export function updateSettings(partial: Partial<Settings>): Settings {
  // 変更分だけ上書きして保存
  settings = { ...settings, ...partial }
  saveSettings()
  return settings
}
