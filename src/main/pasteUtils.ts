import { systemPreferences } from 'electron'
import { execFile } from 'child_process'

let lastSyntheticPasteAt = 0

export function markSyntheticPaste() {
  lastSyntheticPasteAt = Date.now()
}

export function shouldIgnoreSyntheticPaste(): boolean {
  return Date.now() - lastSyntheticPasteAt < 400
}

export function hasAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return false
  return systemPreferences.isTrustedAccessibilityClient(true)
}

export function pasteToFrontmostApp(): boolean {
  // macOS でのみ、アクセシビリティ権限がある場合に Cmd+V を送る
  if (process.platform !== 'darwin') return false

  const trusted = systemPreferences.isTrustedAccessibilityClient(true)
  if (!trusted) return false

  execFile('/usr/bin/osascript', [
    '-e',
    'tell application \"System Events\" to keystroke \"v\" using command down'
  ])
  return true
}
