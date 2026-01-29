export type Settings = {
  enableTray: boolean
}

let settings: Settings = {
  enableTray: true
}

export function getSettings() {
  return settings
}

export function updateSettings(partial: Partial<Settings>) {
  settings = { ...settings, ...partial }
}
