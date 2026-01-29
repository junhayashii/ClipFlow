import { Tray, Menu, app, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null
let getWindow: () => BrowserWindow | null

export function initTray(getMainWindow: () => BrowserWindow | null) {
  getWindow = getMainWindow
}

export function createTray() {
  if (tray) return tray

  tray = new Tray(path.join(app.getAppPath(), 'resources/clipboard.png'))

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        const win = getWindow()
        if (!win) return

        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('Clipboard Manager')
  tray.setContextMenu(menu)

  return tray
}

export function destroyTray() {
  tray?.destroy()
  tray = null
}
