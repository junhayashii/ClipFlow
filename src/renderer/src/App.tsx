import electronLogo from './assets/electron.svg'

import { useState, useEffect } from 'react'

function App(): React.JSX.Element {
  const [history, setHistory] = useState<string[]>([])
  const [enableTray, setEnableTray] = useState(true)

  useEffect(() => {
    window.clipboardApi.onHistory(setHistory)
    window.settingsApi.get().then((s) => setEnableTray(s.enableTray))
  }, [])

  const toggleTray = async () => {
    const updated = await window.settingsApi.update({
      enableTray: !enableTray
    })
    setEnableTray(updated.enableTray)
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <label>
        <input type="checkbox" checked={enableTray} onChange={toggleTray} />
        Enable Tray
      </label>
      <div style={{ padding: 16 }}>
        <h3>Clipboard</h3>
        <ul>
          {history.map((item, i) => (
            <li
              key={i}
              onClick={() => window.clipboardApi.writeText(item)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #ddd', padding: '8px 0' }}
            >
              <pre style={{ whiteSpace: 'pre-wrap' }}>{item}</pre>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
