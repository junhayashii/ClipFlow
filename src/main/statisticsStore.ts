import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

const FILE_NAME = 'statistics.json'

export interface DayCount {
  copy: number
  paste: number
}

/** dateKey -> counts (dateKey = YYYY-MM-DD) */
type DailyData = Record<string, DayCount>

export interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
}

const MAX_DAYS = 365 * 2 // 2年分保持

function getFilePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function loadStatistics(): DailyData {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) return {}

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    if (data == null || typeof data !== 'object') return {}

    const result: DailyData = {}
    for (const [key, val] of Object.entries(data)) {
      if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
      const v = val as unknown
      if (v && typeof v === 'object' && 'copy' in v && 'paste' in v) {
        result[key] = {
          copy: Number((v as DayCount).copy) || 0,
          paste: Number((v as DayCount).paste) || 0
        }
      }
    }
    return result
  } catch (e) {
    console.error('Failed to load statistics:', e)
    return {}
  }
}

export function saveStatistics(data: DailyData): void {
  try {
    const filePath = getFilePath()
    const keys = Object.keys(data).sort()
    if (keys.length > MAX_DAYS) {
      const toKeep = keys.slice(-MAX_DAYS)
      const trimmed: DailyData = {}
      toKeep.forEach((k) => (trimmed[k] = data[k]))
      fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2), 'utf-8')
    } else {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    }
  } catch (e) {
    console.error('Failed to save statistics:', e)
  }
}

export function recordCopy(data: DailyData): DailyData {
  const key = toDateKey(new Date())
  const cur = data[key] ?? { copy: 0, paste: 0 }
  const next = { ...data, [key]: { ...cur, copy: cur.copy + 1 } }
  saveStatistics(next)
  return next
}

export function recordPaste(data: DailyData): DailyData {
  const key = toDateKey(new Date())
  const cur = data[key] ?? { copy: 0, paste: 0 }
  const next = { ...data, [key]: { ...cur, paste: cur.paste + 1 } }
  saveStatistics(next)
  return next
}

/** 週の開始日（月曜）の dateKey を返す */
function getWeekKey(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // 月曜始まり
  d.setDate(d.getDate() + diff)
  return toDateKey(d)
}

/** 月キー YYYY-MM */
function getMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getStatistics(data: DailyData): Statistics {
  const keys = Object.keys(data).sort()
  let totalCopy = 0
  let totalPaste = 0
  keys.forEach((k) => {
    totalCopy += data[k].copy
    totalPaste += data[k].paste
  })

  const lastDays = keys.slice(-30)
  const daily = lastDays.map((date) => {
    const d = parseDateKey(date)
    const label = d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
    return {
      date,
      dateLabel: label,
      copy: data[date].copy,
      paste: data[date].paste
    }
  })

  const weekMap = new Map<string, DayCount>()
  keys.forEach((date) => {
    const d = parseDateKey(date)
    const wk = getWeekKey(d)
    const cur = weekMap.get(wk) ?? { copy: 0, paste: 0 }
    weekMap.set(wk, {
      copy: cur.copy + data[date].copy,
      paste: cur.paste + data[date].paste
    })
  })
  const weekly = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([period, count]) => {
      const start = parseDateKey(period)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const periodLabel =
        start.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) +
        '〜' +
        end.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
      return { period: periodLabel, ...count }
    })

  const monthMap = new Map<string, DayCount>()
  keys.forEach((date) => {
    const d = parseDateKey(date)
    const mk = getMonthKey(d)
    const cur = monthMap.get(mk) ?? { copy: 0, paste: 0 }
    monthMap.set(mk, {
      copy: cur.copy + data[date].copy,
      paste: cur.paste + data[date].paste
    })
  })
  const monthly = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([period, count]) => ({
      period: period.replace(/-/, '年') + '月',
      ...count
    }))

  return {
    totalCopy,
    totalPaste,
    daily,
    weekly,
    monthly
  }
}
