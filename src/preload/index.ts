import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ClipboardItem } from '../main/clipboardTypes'

// レンダラーに公開する API（安全な範囲だけ）
const api = {}

// contextIsolation が有効な場合は contextBridge で公開する
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // contextIsolation が無い場合は window に直接ぶら下げる
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// クリップボード関連 API（IPC 経由で main と通信）
contextBridge.exposeInMainWorld('clipboardApi', {
  readText: () => ipcRenderer.invoke('clipboard:readText'),
  onChange: (callback: (text: string) => void) => {
    ipcRenderer.on('clipboard:changed', (_, text) => {
      callback(text)
    })
  },

  getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),

  onHistory: (callback: (history: ClipboardItem[]) => void) => {
    // main からの履歴更新イベントを購読
    const listener = (_: unknown, history: ClipboardItem[]) => {
      callback(history)
    }

    ipcRenderer.on('clipboard:history', listener)

    return () => {
      ipcRenderer.removeListener('clipboard:history', listener)
    }
  },

  writeText: (text: string) => {
    ipcRenderer.invoke('clipboard:writeText', text)
  },

  writeImage: (dataUrl: string, filename?: string) => {
    // 画像の再コピー（dataUrl を渡す）
    ipcRenderer.invoke('clipboard:writeImage', dataUrl, filename)
  },

  removeFromHistory: (id: string) => {
    return ipcRenderer.invoke('clipboard:removeFromHistory', id)
  }
})

// 設定 API
contextBridge.exposeInMainWorld('settingsApi', {
  get: () => ipcRenderer.invoke('settings:get'),
  update: (partial) => ipcRenderer.invoke('settings:update', partial)
})

// 統計 API
contextBridge.exposeInMainWorld('statisticsApi', {
  get: () => ipcRenderer.invoke('statistics:get')
})

// ブックマーク API
contextBridge.exposeInMainWorld('bookmarkApi', {
  get: () => ipcRenderer.invoke('bookmarks:get'),
  add: (content: string, timestamp?: number) =>
    ipcRenderer.invoke('bookmarks:add', content, timestamp),
  remove: (id: string) => ipcRenderer.invoke('bookmarks:remove', id),
  onBookmarks: (callback: (bookmarks: { id: string; content: string; timestamp: number }[]) => void) => {
    const listener = (_: unknown, list: { id: string; content: string; timestamp: number }[]) =>
      callback(list)
    ipcRenderer.on('bookmarks:updated', listener)
    return () => ipcRenderer.removeListener('bookmarks:updated', listener)
  }
})
