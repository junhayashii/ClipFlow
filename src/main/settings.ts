import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

const FILE_NAME = 'settings.json'

export type Settings = {
  enableTray: boolean
  darkMode: boolean
}

const defaults: Settings = {
  enableTray: true,
  darkMode: false
}

let settings: Settings = { ...defaults }

function getFilePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

export function loadSettings(): Settings {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return { ...defaults }

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
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function getSettings(): Settings {
  return settings
}

/** app ready 後に呼ぶ（userData が使えるようになってから） */
export function initSettings(): void {
  settings = loadSettings()
}

export function updateSettings(partial: Partial<Settings>): Settings {
  settings = { ...settings, ...partial }
  saveSettings()
  return settings
}
