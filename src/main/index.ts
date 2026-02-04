import { app, shell, BrowserWindow, ipcMain, clipboard, globalShortcut, nativeImage } from 'electron'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { getSettings, updateSettings, initSettings } from './settings'
import { createTray, destroyTray, initTray } from './tray'
import { loadHistory, saveHistory } from './historyStore'
import { type ClipboardItem, isSameClipboardItem } from './clipboardTypes'
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

  initSettings()

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
// 履歴の最大件数（保存時にも制限）
const MAX_HISTORY = 20
let history: ClipboardItem[] = loadHistory()
// 直前に保存した内容の識別子（連続検出の重複防止）
let lastSignature = ''

// 統計（app ready 後に loadStatistics で初期化）
let statisticsData: DailyData = {}
// 画像とみなす拡張子一覧（ファイルコピー時の判定に使用）
const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
  '.heic',
  '.heif'
])

function createId() {
  // 履歴アイテムのユニーク ID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function broadcastHistory() {
  // すべてのレンダラーへ履歴更新を通知
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('clipboard:history', history)
  })
}

function addHistoryItem(item: ClipboardItem) {
  // 同じ内容は重複させず、先頭に移動
  history = history.filter((existing) => !isSameClipboardItem(existing, item))
  history.unshift(item)

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }

  saveHistory(history)
}

function readClipboardString(format: string) {
  // 文字列形式で取得できない場合は Buffer を UTF-8/UTF-16 で読み取る
  const raw = clipboard.read(format)
  if (raw) return raw
  try {
    const buffer = clipboard.readBuffer(format)
    if (buffer && buffer.length > 0) {
      const utf8 = buffer.toString('utf8')
      if (utf8 && (utf8.includes('file://') || utf8.includes('/'))) return utf8
      const utf16 = buffer.toString('utf16le')
      if (utf16 && (utf16.includes('file://') || utf16.includes('/'))) return utf16
      return utf8 || utf16
    }
  } catch {
    return ''
  }
  return ''
}

function normalizeFilePaths(value: unknown): string[] {
  // bplist などから返る値を string 配列に正規化
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  if (typeof value === 'string') {
    return [value]
  }
  return []
}

function parseBplistPaths(buffer: Buffer): string[] {
  // macOS の NSFilenamesPboardType などは bplist 形式で来ることがある
  if (buffer.slice(0, 8).toString('utf8') !== 'bplist00') return []

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parser = require('bplist-parser')
    const parsed = parser.parseBuffer(buffer)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return normalizeFilePaths(parsed[0])
    }
  } catch {
    // ignore
  }

  if (process.platform !== 'darwin') return []

  // bplist パーサがない場合は plutil で JSON に変換して読む
  const tempPath = join(tmpdir(), `clipflow-${Date.now()}-${Math.random().toString(36).slice(2)}.plist`)
  try {
    fs.writeFileSync(tempPath, buffer)
    const output = execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', tempPath], {
      encoding: 'utf8'
    })
    const parsed = JSON.parse(output) as unknown
    return normalizeFilePaths(parsed)
  } catch {
    return []
  } finally {
    try {
      fs.unlinkSync(tempPath)
    } catch {
      // ignore
    }
  }
}

function extractFilePathFromBuffer(buffer: Buffer): string {
  // bplist からのパス抽出を最優先
  const bplistPaths = parseBplistPaths(buffer)
  for (const candidate of bplistPaths) {
    if (candidate.startsWith('file://')) {
      try {
        const filePath = fileURLToPath(candidate)
        if (fs.existsSync(filePath)) return filePath
      } catch {
        // ignore
      }
    }
    if (candidate.startsWith('/') && fs.existsSync(candidate)) {
      return candidate
    }
  }

  // テキストとして読める場合は URL / パスを拾う
  const candidates = [buffer.toString('utf8'), buffer.toString('utf16le')].map((text) =>
    text.replace(/\u0000/g, '')
  )

  for (const text of candidates) {
    const fileUrlMatch = text.match(/file:\/\/[^\s]+/i)
    if (fileUrlMatch) {
      try {
        const filePath = fileURLToPath(fileUrlMatch[0])
        if (fs.existsSync(filePath)) return filePath
      } catch {
        // ignore
      }
    }

    const pathMatch = text.match(/\/[^\n]+?\.(png|jpe?g|gif|webp|bmp|tiff?)/i)
    if (pathMatch && fs.existsSync(pathMatch[0])) {
      return pathMatch[0]
    }
  }

  return ''
}

function getFilePathFromClipboard(formats: string[]) {
  // ファイルコピーの代表的なフォーマットからパスを取得
  const candidates = ['public.file-url', 'public.url', 'text/uri-list', 'NSFilenamesPboardType']
  for (const format of candidates) {
    if (!formats.includes(format)) {
      try {
        const buffer = clipboard.readBuffer(format)
        if (!buffer || buffer.length === 0) continue
      } catch {
        continue
      }
    }

    const raw = readClipboardString(format)
    if (!raw) continue
    const lines = raw
      .replace(/\0/g, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
    for (const line of lines) {
      if (line.startsWith('file://')) {
        try {
          const filePath = fileURLToPath(line)
          if (fs.existsSync(filePath)) return filePath
        } catch {
          continue
        }
      }
      if (line.startsWith('/')) {
        if (fs.existsSync(line)) return line
      }
    }

    try {
      const buffer = clipboard.readBuffer(format)
      if (buffer && buffer.length > 0) {
        const extracted = extractFilePathFromBuffer(buffer)
        if (extracted) return extracted
      }
    } catch {
      // ignore
    }
  }
  return ''
}

function loadImageFromFile(filePath: string) {
  // 画像ファイルを NativeImage に読み込む（パス読み込みが失敗したら Buffer で再試行）
  let image = nativeImage.createFromPath(filePath)
  if (image.isEmpty()) {
    try {
      const buffer = fs.readFileSync(filePath)
      image = nativeImage.createFromBuffer(buffer)
    } catch {
      return null
    }
  }
  if (image.isEmpty()) return null
  return image
}

function formatImageName(timestamp: number) {
  // ファイル名が無い場合の表示名
  const iso = new Date(timestamp).toISOString().replace('T', ' ').replace('Z', '')
  const safe = iso.replace(/[:]/g, '-')
  return `Image ${safe}`
}

setInterval(() => {
  // 1秒ごとにクリップボードを監視（ファイル→画像→テキストの順で優先）
  const formats = clipboard.availableFormats()
  const hasFileFormat = formats.some((format) =>
    ['public.file-url', 'public.url', 'text/uri-list', 'NSFilenamesPboardType'].includes(format)
  )
  const filePath = getFilePathFromClipboard(formats)
  if (filePath) {
    // ファイルパスが取れる場合は拡張子で画像かどうか判断
    const ext = extname(filePath).toLowerCase()
    if (!IMAGE_EXTENSIONS.has(ext)) {
      const signature = `file:${filePath}`
      if (signature !== lastSignature) lastSignature = signature
      return
    }

    const fileImage = loadImageFromFile(filePath)
    if (!fileImage) {
      const signature = `file:${filePath}`
      if (signature !== lastSignature) lastSignature = signature
      return
    }

    // 画像ファイル名を表示用に保存
    const filename = basename(filePath)
    const dataUrl = fileImage.toDataURL()
    const signature = `image:${dataUrl}`
    if (signature === lastSignature) return
    lastSignature = signature

    const size = fileImage.getSize()
    addHistoryItem({
      id: createId(),
      type: 'image',
      dataUrl,
      width: size.width,
      height: size.height,
      filename,
      timestamp: Date.now()
    })

    statisticsData = recordCopyStats(statisticsData)
    broadcastHistory()
    return
  }
  if (hasFileFormat) {
    // ファイルコピーだがパスが取れない場合はアイコン画像を保存しない
    const signature = `file:unknown:${formats.join(',')}`
    if (signature !== lastSignature) lastSignature = signature
    return
  }

  const image = clipboard.readImage()
  if (!image.isEmpty()) {
    // 画像データとして取得できる場合（アプリからの画像コピーなど）
    const timestamp = Date.now()
    const dataUrl = image.toDataURL()
    const signature = `image:${dataUrl}`
    if (signature === lastSignature) return
    lastSignature = signature

    const size = image.getSize()
    addHistoryItem({
      id: createId(),
      type: 'image',
      dataUrl,
      width: size.width,
      height: size.height,
      filename: formatImageName(timestamp),
      timestamp
    })

    statisticsData = recordCopyStats(statisticsData)
    broadcastHistory()
    return
  }

  const text = clipboard.readText()
  if (!text) return
  // テキストコピーの場合
  const signature = `text:${text}`
  if (signature === lastSignature) return
  lastSignature = signature

  addHistoryItem({
    id: createId(),
    type: 'text',
    content: text,
    timestamp: Date.now()
  })

  statisticsData = recordCopyStats(statisticsData)
  broadcastHistory()
}, 1000)

// ==========================
// IPC
// ==========================
ipcMain.handle('clipboard:readText', () => clipboard.readText())

ipcMain.handle('clipboard:writeText', (_, text: string) => {
  // レンダラーからの「コピー要求」
  if (!text) return
  clipboard.writeText(text)

  addHistoryItem({
    id: createId(),
    type: 'text',
    content: text,
    timestamp: Date.now()
  })
  lastSignature = `text:${text}`
  statisticsData = recordCopyStats(statisticsData)
  broadcastHistory()
})

ipcMain.handle('clipboard:writeImage', (_, dataUrl: string, filename?: string) => {
  // レンダラーからの「画像コピー要求」
  if (!dataUrl) return
  const image = nativeImage.createFromDataURL(dataUrl)
  if (image.isEmpty()) return

  clipboard.writeImage(image)
  const size = image.getSize()
  const timestamp = Date.now()

  addHistoryItem({
    id: createId(),
    type: 'image',
    dataUrl,
    width: size.width,
    height: size.height,
    filename: filename || formatImageName(timestamp),
    timestamp
  })

  lastSignature = `image:${dataUrl}`
  statisticsData = recordCopyStats(statisticsData)
  broadcastHistory()
})

ipcMain.handle('clipboard:getHistory', () => {
  // 現在の履歴を返す
  return history
})

ipcMain.handle('clipboard:removeFromHistory', (_, id: string) => {
  // ID で履歴から削除
  history = history.filter((item) => item.id !== id)
  saveHistory(history)
  broadcastHistory()
  return history
})

// ==========================
// Bookmarks（履歴のMAX制限なし・永続）
// ==========================
let bookmarks: BookmarkItem[] = loadBookmarks()

function sendBookmarksToRenderers(): void {
  // すべてのレンダラーへブックマーク更新を通知
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('bookmarks:updated', bookmarks)
  })
}

ipcMain.handle('bookmarks:get', () => bookmarks)

ipcMain.handle('bookmarks:add', (_, content: string, timestamp?: number) => {
  // 追加後に全レンダラーへ通知
  bookmarks = addBookmarkStore(bookmarks, content, timestamp)
  sendBookmarksToRenderers()
  return bookmarks
})

ipcMain.handle('bookmarks:remove', (_, id: string) => {
  // 削除後に全レンダラーへ通知
  bookmarks = removeBookmarkStore(bookmarks, id)
  sendBookmarksToRenderers()
  return bookmarks
})

ipcMain.handle('statistics:get', () => getStatistics(statisticsData))

ipcMain.handle('settings:get', () => {
  // 設定の読み込み
  return getSettings()
})

ipcMain.handle('settings:update', (_, partial) => {
  // 設定の更新とトレイの有効/無効切り替え
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
