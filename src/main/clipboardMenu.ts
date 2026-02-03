import { Menu, BrowserWindow, clipboard, systemPreferences } from 'electron'
import { execFile } from 'child_process'

function pasteToFrontmostApp() {
  if (process.platform !== 'darwin') return

  const trusted = systemPreferences.isTrustedAccessibilityClient(true)
  if (!trusted) return

  execFile('/usr/bin/osascript', [
    '-e',
    'tell application "System Events" to keystroke "v" using command down'
  ])
}

export function showClipboardMenu(history: string[], win?: BrowserWindow) {
  if (!history.length) return

  const template = history.slice(0, 10).map((text) => ({
    label: text.length > 50 ? text.slice(0, 50) + '…' : text,
    click: () => {
      clipboard.writeText(text)
      pasteToFrontmostApp()

      win?.hide()
    }
  }))

  const menu = Menu.buildFromTemplate(template)
  menu.popup()
}
