interface SettingsPageProps {
  enableTray: boolean
  darkMode: boolean
  onToggleTray: () => Promise<void>
  onToggleDarkMode: () => Promise<void>
}

export default function SettingsPage({
  enableTray,
  darkMode,
  onToggleTray,
  onToggleDarkMode
}: SettingsPageProps) {
  return (
    <div className="p-6 space-y-8 max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      {/* Appearance */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
          Appearance
        </h2>
        <label className="flex items-center justify-between gap-4 py-2">
          <span className="text-slate-700 dark:text-slate-300">Dark Mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={onToggleDarkMode}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              darkMode
                ? 'border-sky-500 bg-sky-500'
                : 'border-slate-200 bg-slate-200 dark:border-slate-600 dark:bg-slate-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition translate-y-0.5 ${
                darkMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </section>

      {/* System */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">System</h2>
        <label className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={enableTray} onChange={onToggleTray} />
          Enable Tray
        </label>
      </section>
    </div>
  )
}
