export {}

declare global {
  interface ClipboardApi {
    readText: () => Promise<string>
    writeText: (text: string) => Promise<void>

    // 👇 これを追加
    getHistory: () => Promise<string[]>

    onHistory: (callback: (history: string[]) => void) => () => void
  }

  interface Window {
    clipboardApi: ClipboardApi
    settingsApi: {
      get: () => Promise<{ enableTray: boolean }>
      update: (partial: { enableTray?: boolean }) => Promise<{ enableTray: boolean }>
    }
  }
}
