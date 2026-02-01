interface SettingsPageProps {
  enableTray: boolean
  onToggleTray: () => Promise<void>
}

export default function SettingsPage({ enableTray, onToggleTray }: SettingsPageProps) {
  return (
    <div className="p-6 space-y-8 max-w-xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Tray */}
      <section>
        <h2 className="text-sm font-semibold mb-2">System</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={enableTray} onChange={onToggleTray} />
          Enable Tray
        </label>
      </section>
    </div>
  )
}
