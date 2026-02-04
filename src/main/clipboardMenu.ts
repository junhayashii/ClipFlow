import { Menu, BrowserWindow, clipboard, screen, systemPreferences, nativeImage } from 'electron'
import { execFile } from 'child_process'
import type { ClipboardItem } from './clipboardTypes'

// macOS のメニュー表示位置調整用（アンカーウィンドウ）
let anchorWindow: BrowserWindow | null = null
// カーソル位置から少しずらすためのオフセット
const MENU_OFFSET = { x: 2, y: -10 }

function pasteToFrontmostApp() {
  // macOS でのみ、アクセシビリティ権限がある場合に Cmd+V を送る
  if (process.platform !== 'darwin') return

  const trusted = systemPreferences.isTrustedAccessibilityClient(true)
  if (!trusted) return

  execFile('/usr/bin/osascript', [
    '-e',
    'tell application "System Events" to keystroke "v" using command down'
  ])
}

function getAnchorWindow(displayBounds: { x: number; y: number }) {
  // Menu.popup の位置調整用に 1px の透明ウィンドウを使う
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

  // 先頭10件をメニューに表示
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
        // 選択された履歴を実際のクリップボードへ書き込む
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
    // macOS は anchor window を使って正しい位置に popup
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

  // Windows / Linux は通常の popup でOK
  menu.popup({
    x: Math.round(cursorPoint.x + MENU_OFFSET.x),
    y: Math.round(cursorPoint.y + MENU_OFFSET.y)
  })
}
