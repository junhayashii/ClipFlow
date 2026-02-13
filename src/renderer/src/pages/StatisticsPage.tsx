import { useEffect, useState } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { ClipboardPaste, Copy, PieChart as PieIcon, TrendingUp } from 'lucide-react'

// API から受け取る統計データの形
interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
  copyTypes: { text: number; link: number; code: number; image: number }
  pasteTypes: { text: number; link: number; code: number; image: number }
}

type TimeFrame = 'weekly' | 'monthly'

type ChartPoint = {
  name: string
  copies: number
  pastes: number
  label?: string
}

type ContentSlice = {
  name: string
  value: number
  color: string
}

const TYPE_COLORS: Record<string, string> = {
  Text: '#0ea5e9',
  Link: '#3b82f6',
  Code: '#f59e0b',
  Image: '#10b981'
}

export default function StatisticsPage() {
  // 取得した統計データを保持
  const [stats, setStats] = useState<Statistics | null>(null)
  // 読み込み状態
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly')

  const fetchStats = (withLoading = false) => {
    if (withLoading) setLoading(true)
    window.statisticsApi
      .get()
      .then((data) => setStats(data))
      .finally(() => {
        if (withLoading) setLoading(false)
      })
  }

  useEffect(() => {
    // 初回読み込み + 自動更新
    let cancelled = false
    if (!cancelled) fetchStats(true)

    const unsubscribe = window.statisticsApi.onUpdate((data) => {
      if (!cancelled) setStats(data)
    })

    const onFocus = () => {
      if (!cancelled) fetchStats(false)
    }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      unsubscribe?.()
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  if (loading && !stats) {
    return (
      <div className="p-6 h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
        読み込み中...
      </div>
    )
  }

  // null の場合のフォールバック
  const s = stats ?? {
    totalCopy: 0,
    totalPaste: 0,
    daily: [],
    weekly: [],
    monthly: [],
    copyTypes: { text: 0, link: 0, code: 0, image: 0 },
    pasteTypes: { text: 0, link: 0, code: 0, image: 0 }
  }

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const weeklyData: ChartPoint[] = s.daily.slice(-7).map((row) => ({
    name: row.dateLabel.split('(')[0],
    copies: row.copy,
    pastes: row.paste,
    label: row.dateLabel
  }))

  const monthlyData: ChartPoint[] = s.weekly.slice(-4).map((row, index) => ({
    name: `Week ${index + 1}`,
    copies: row.copy,
    pastes: row.paste,
    label: row.period
  }))

  const currentData = timeFrame === 'weekly' ? weeklyData : monthlyData

  const totals = {
    copies: currentData.reduce((sum, row) => sum + row.copies, 0),
    pastes: currentData.reduce((sum, row) => sum + row.pastes, 0)
  }

  const totalsByType = {
    text: s.copyTypes.text + s.pasteTypes.text,
    link: s.copyTypes.link + s.pasteTypes.link,
    code: s.copyTypes.code + s.pasteTypes.code,
    image: s.copyTypes.image + s.pasteTypes.image
  }
  const contentDistribution: ContentSlice[] = [
    { name: 'Text', value: totalsByType.text, color: TYPE_COLORS.Text },
    { name: 'Link', value: totalsByType.link, color: TYPE_COLORS.Link },
    { name: 'Code', value: totalsByType.code, color: TYPE_COLORS.Code },
    { name: 'Image', value: totalsByType.image, color: TYPE_COLORS.Image }
  ]

  const totalContent = contentDistribution.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Statistics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            コピー / ペーストの推移とタイプ別内訳
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setTimeFrame('weekly')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              timeFrame === 'weekly'
                ? 'border border-slate-900/60 dark:border-slate-100/60 text-slate-900 dark:text-slate-100'
                : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeFrame('monthly')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              timeFrame === 'monthly'
                ? 'border border-slate-900/60 dark:border-slate-100/60 text-slate-900 dark:text-slate-100'
                : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Copy size={14} /> Copy
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {totals.copies.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {timeFrame === 'weekly' ? '直近7日' : '直近4週'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ClipboardPaste size={14} /> Paste
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {totals.pastes.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {timeFrame === 'weekly' ? '直近7日' : '直近4週'}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 p-5 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400 dark:text-slate-500" />
              Activity Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {timeFrame === 'weekly' ? '直近7日' : '直近4週'}
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {currentData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              データがありません
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCopies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPastes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="8 8"
                  stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#71717a' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? '#71717a' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <RechartsTooltip
                  cursor={{
                    stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    strokeWidth: 1
                  }}
                  contentStyle={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    padding: '10px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                  labelStyle={{
                    color: isDark ? '#71717a' : '#64748b',
                    marginBottom: '6px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '10px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="copies"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCopies)"
                />
                <Area
                  type="monotone"
                  dataKey="pastes"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPastes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieIcon size={16} className="text-slate-400 dark:text-slate-500" />
            Content Mix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            copy + paste の合計
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          <div className="h-[220px] w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={contentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={94}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {contentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 max-w-lg w-full space-y-4">
            {contentDistribution.map((item) => {
              const percentage =
                totalContent === 0 ? 0 : Math.round((item.value / totalContent) * 100)
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
