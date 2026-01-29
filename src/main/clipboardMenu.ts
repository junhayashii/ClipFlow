import { Menu, BrowserWindow, clipboard } from 'electron'

export function showClipboardMenu(history: string[], win?: BrowserWindow) {
  if (!history.length) return

  const template = history.slice(0, 10).map((text) => ({
    label: text.length > 50 ? text.slice(0, 50) + '…' : text,
    click: () => {
      clipboard.writeText(text)

      win?.hide()
    }
  }))

  const menu = Menu.buildFromTemplate(template)
  menu.popup()
}
