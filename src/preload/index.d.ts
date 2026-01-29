import { ElectronAPI } from '@electron-toolkit/preload'

export interface ClipboardApi {
  readText(): Promise<string>
  onChange(callback: (text: string) => void): void
  onHistory(callback: (history: string[]) => void): void
  writeText(text: string): Promise<void>
}

export interface Settings {
  enableTray: boolean
}

export interface SettingsApi {
  get(): Promise<Settings>
  update(partial: Partial<Settings>): Promise<Settings>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    clipboardApi: ClipboardApi
    settingsApi: SettingsApi
  }
}
