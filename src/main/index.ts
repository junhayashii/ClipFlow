import { app, shell, BrowserWindow, ipcMain, clipboard, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { getSettings, updateSettings } from './settings'
import { createTray, destroyTray, initTray } from './tray'
import { loadHistory, saveHistory } from './historyStore'
import {
  loadBookmarks,
  addBookmark as addBookmarkStore,
  removeBookmark as removeBookmarkStore,
  type BookmarkItem
} from './bookmarkStore'
import {
  loadStatistics,
  recordCopy as recordCopyStats,
  recordPaste as recordPasteStats,
  getStatistics,
  type DailyData
} from './statisticsStore'
import { showClipboardMenu } from './clipboardMenu'

// ==========================
// Window 管理
// ==========================
let mainWindow: BrowserWindow | null = null

let isQuitting = false

app.on('before-quit', () => {
  isQuitting = true
})

function createWindow(): BrowserWindow {
  if (mainWindow) return mainWindow

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // mac 常駐アプリっぽく：×で終了しない
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ==========================
// App lifecycle
// ==========================
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // window 作成
  const win = createWindow()

  statisticsData = loadStatistics()

  // tray に window 操作を渡す
  initTray(() => win)

  globalShortcut.register('Command+Shift+V', () => {
    showClipboardMenu(history, undefined, () => {
      statisticsData = recordPasteStats(statisticsData)
    })
  })

  if (getSettings().enableTray) {
    createTray()
    if (app.dock) app.dock.hide()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ==========================
// Clipboard 監視 & 履歴
// ==========================
const MAX_HISTORY = 20
let history: string[] = loadHistory()
let lastText = ''

// 統計（app ready 後に loadStatistics で初期化）
let statisticsData: DailyData = {}

setInterval(() => {
  const text = clipboard.readText()

  if (!text || text === lastText) return
  lastText = text

  history = history.filter((item) => item !== text)
  history.unshift(text)

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }

  saveHistory(history)
  statisticsData = recordCopyStats(statisticsData)

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('clipboard:history', history)
  })
}, 1000)

// ==========================
// IPC
// ==========================
ipcMain.handle('clipboard:readText', () => clipboard.readText())

ipcMain.handle('clipboard:writeText', (_, text: string) => {
  clipboard.writeText(text)

  history = history.filter((item) => item !== text)
  history.unshift(text)
  saveHistory(history)
  statisticsData = recordCopyStats(statisticsData)
})

ipcMain.handle('clipboard:getHistory', () => {
  return history
})

// ==========================
// Bookmarks（履歴のMAX制限なし・永続）
// ==========================
let bookmarks: BookmarkItem[] = loadBookmarks()

function sendBookmarksToRenderers(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('bookmarks:updated', bookmarks)
  })
}

ipcMain.handle('bookmarks:get', () => bookmarks)

ipcMain.handle('bookmarks:add', (_, content: string, timestamp?: number) => {
  bookmarks = addBookmarkStore(bookmarks, content, timestamp)
  sendBookmarksToRenderers()
  return bookmarks
})

ipcMain.handle('bookmarks:remove', (_, id: string) => {
  bookmarks = removeBookmarkStore(bookmarks, id)
  sendBookmarksToRenderers()
  return bookmarks
})

ipcMain.handle('statistics:get', () => getStatistics(statisticsData))

ipcMain.handle('settings:get', () => {
  return getSettings()
})

ipcMain.handle('settings:update', (_, partial) => {
  updateSettings(partial)

  if (partial.enableTray !== undefined) {
    if (partial.enableTray) {
      createTray()
      if (app.dock) app.dock.hide()
    } else {
      destroyTray()
      if (app.dock) app.dock.show()
    }
  }

  return getSettings()
})
