import { Menu, BrowserWindow, clipboard, screen, systemPreferences, nativeImage } from 'electron'
import { execFile } from 'child_process'
import type { ClipboardItem } from './clipboardTypes'

let anchorWindow: BrowserWindow | null = null
const MENU_OFFSET = { x: 2, y: -10 }

function pasteToFrontmostApp() {
  if (process.platform !== 'darwin') return

  const trusted = systemPreferences.isTrustedAccessibilityClient(true)
  if (!trusted) return

  execFile('/usr/bin/osascript', [
    '-e',
    'tell application "System Events" to keystroke "v" using command down'
  ])
}

function getAnchorWindow(displayBounds: { x: number; y: number }) {
  if (!anchorWindow || anchorWindow.isDestroyed()) {
    anchorWindow = new BrowserWindow({
      width: 1,
      height: 1,
      x: displayBounds.x,
      y: displayBounds.y,
      show: false,
      frame: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      focusable: false,
      skipTaskbar: true,
      transparent: true,
      hasShadow: false
    })
    anchorWindow.setIgnoreMouseEvents(true)
  } else {
    anchorWindow.setBounds({
      x: displayBounds.x,
      y: displayBounds.y,
      width: 1,
      height: 1
    })
  }

  return anchorWindow
}

export function showClipboardMenu(
  history: ClipboardItem[],
  win?: BrowserWindow,
  onPaste?: () => void
) {
  if (!history.length) return

  const template = history.slice(0, 10).map((item) => {
    const label =
      item.type === 'text'
        ? item.content.length > 50
          ? item.content.slice(0, 50) + '…'
          : item.content
        : item.filename
          ? item.filename
          : `Image ${item.width}x${item.height}`

    return {
      label,
      click: () => {
        if (item.type === 'text') {
          clipboard.writeText(item.content)
        } else {
          clipboard.writeImage(nativeImage.createFromDataURL(item.dataUrl))
        }
        pasteToFrontmostApp()
        onPaste?.()

        win?.hide()
      }
    }
  })

  const menu = Menu.buildFromTemplate(template)
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)

  if (process.platform === 'darwin') {
    const anchor = getAnchorWindow(display.bounds)
    const x = Math.round(cursorPoint.x - display.bounds.x + MENU_OFFSET.x)
    const y = Math.round(cursorPoint.y - display.bounds.y + MENU_OFFSET.y)

    const popup = () => {
      menu.popup({
        window: anchor,
        x,
        y,
        callback: () => anchor.hide()
      })
    }

    if (!anchor.isVisible()) {
      anchor.showInactive()
      setTimeout(popup, 0)
    } else {
      popup()
    }
    return
  }

  menu.popup({
    x: Math.round(cursorPoint.x + MENU_OFFSET.x),
    y: Math.round(cursorPoint.y + MENU_OFFSET.y)
  })
}
