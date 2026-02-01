import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('clipboardApi', {
  readText: () => ipcRenderer.invoke('clipboard:readText'),
  onChange: (callback: (text: string) => void) => {
    ipcRenderer.on('clipboard:changed', (_, text) => {
      callback(text)
    })
  },

  getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),

  onHistory: (callback: (history: string[]) => void) => {
    const listener = (_: unknown, history: string[]) => {
      callback(history)
    }

    ipcRenderer.on('clipboard:history', listener)

    return () => {
      ipcRenderer.removeListener('clipboard:history', listener)
    }
  },

  writeText: (text: string) => {
    ipcRenderer.invoke('clipboard:writeText', text)
  }
})

contextBridge.exposeInMainWorld('settingsApi', {
  get: () => ipcRenderer.invoke('settings:get'),
  update: (partial) => ipcRenderer.invoke('settings:update', partial)
})
