import { useState, useEffect } from 'react'
import { Copy, ClipboardPaste, Calendar, CalendarDays, CalendarRange } from 'lucide-react'

interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.statisticsApi.get().then((data) => {
      if (!cancelled) {
        setStats(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = () => {
    setLoading(true)
    window.statisticsApi.get().then(setStats).finally(() => setLoading(false))
  }

  if (loading && !stats) {
    return (
      <div className="p-6 h-full flex items-center justify-center text-slate-500">
        読み込み中...
      </div>
    )
  }

  const s = stats ?? {
    totalCopy: 0,
    totalPaste: 0,
    daily: [],
    weekly: [],
    monthly: []
  }

  const total = s.totalCopy + s.totalPaste

  return (
    <div className="p-6 h-full flex flex-col max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Statistics</h1>
        <button
          type="button"
          onClick={refresh}
          className="text-sm text-slate-500 hover:text-sky-600"
        >
          更新
        </button>
      </div>

      {/* 総累計 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <Calendar size={16} />
          総累計
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Copy size={14} />
              コピー
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">
              {s.totalCopy.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <ClipboardPaste size={14} />
              ペースト
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">
              {s.totalPaste.toLocaleString()}
            </div>
          </div>
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <div className="text-slate-500 text-sm mb-1">合計</div>
            <div className="text-2xl font-bold text-sky-700 tabular-nums">
              {total.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* 日別 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
          <CalendarDays size={16} />
          日別（直近30日）
        </h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-2.5 px-4 font-medium text-slate-600">日付</th>
                <th className="text-right py-2.5 px-4 font-medium text-slate-600">コピー</th>
                <th className="text-right py-2.5 px-4 font-medium text-slate-600">ペースト</th>
              </tr>
            </thead>
            <tbody>
              {s.daily.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    データがありません
                  </td>
                </tr>
              ) : (
                [...s.daily].reverse().map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="py-2 px-4 text-slate-700">{row.dateLabel}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                      {row.copy}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                      {row.paste}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 週別・月別 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
            <CalendarRange size={16} />
            週別（直近12週）
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2.5 px-4 font-medium text-slate-600">週</th>
                  <th className="text-right py-2.5 px-4 font-medium text-slate-600">コピー</th>
                  <th className="text-right py-2.5 px-4 font-medium text-slate-600">ペースト</th>
                </tr>
              </thead>
              <tbody>
                {s.weekly.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      データがありません
                    </td>
                  </tr>
                ) : (
                  [...s.weekly].reverse().map((row, i) => (
                    <tr
                      key={row.period + i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="py-2 px-4 text-slate-700">{row.period}</td>
                      <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                        {row.copy}
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                        {row.paste}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
            <CalendarRange size={16} />
            月別（直近12ヶ月）
          </h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2.5 px-4 font-medium text-slate-600">月</th>
                  <th className="text-right py-2.5 px-4 font-medium text-slate-600">コピー</th>
                  <th className="text-right py-2.5 px-4 font-medium text-slate-600">ペースト</th>
                </tr>
              </thead>
              <tbody>
                {s.monthly.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      データがありません
                    </td>
                  </tr>
                ) : (
                  [...s.monthly].reverse().map((row) => (
                    <tr
                      key={row.period}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="py-2 px-4 text-slate-700">{row.period}</td>
                      <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                        {row.copy}
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-slate-700">
                        {row.paste}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
