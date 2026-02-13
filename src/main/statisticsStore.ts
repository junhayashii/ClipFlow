import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

// 統計データの保存ファイル名
const FILE_NAME = 'statistics.json'

export type ClipCategory = 'text' | 'link' | 'code' | 'image'

export interface TypeCounts {
  text: number
  link: number
  code: number
  image: number
}

function createEmptyTypeCounts(): TypeCounts {
  return { text: 0, link: 0, code: 0, image: 0 }
}

// 1日のコピー/ペースト回数
export interface DayCount {
  copy: number
  paste: number
  copyTypes?: TypeCounts
  pasteTypes?: TypeCounts
}

/** dateKey -> counts (dateKey = YYYY-MM-DD) */
export type DailyData = Record<string, DayCount>

// UI に渡す統計データの形
export interface Statistics {
  totalCopy: number
  totalPaste: number
  daily: Array<{ date: string; dateLabel: string; copy: number; paste: number }>
  weekly: Array<{ period: string; copy: number; paste: number }>
  monthly: Array<{ period: string; copy: number; paste: number }>
  copyTypes: TypeCounts
  pasteTypes: TypeCounts
}

// 2年分を上限として保持
const MAX_DAYS = 365 * 2

function getFilePath(): string {
  // OSごとの userData 配下に保存
  return join(app.getPath('userData'), FILE_NAME)
}

// Date -> YYYY-MM-DD
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// YYYY-MM-DD -> Date
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

    // 不正な形のデータは捨てつつ復元
    const result: DailyData = {}
    for (const [key, val] of Object.entries(data)) {
      if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
      const v = val as unknown
      if (v && typeof v === 'object' && 'copy' in v && 'paste' in v) {
        const raw = v as DayCount
        result[key] = {
          copy: Number(raw.copy) || 0,
          paste: Number(raw.paste) || 0,
          copyTypes: raw.copyTypes ?? createEmptyTypeCounts(),
          pasteTypes: raw.pasteTypes ?? createEmptyTypeCounts()
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
    // 保持上限を超える場合は最新分だけ保存
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

export function recordCopy(data: DailyData, type: ClipCategory): DailyData {
  // 今日のコピー回数を +1
  const key = toDateKey(new Date())
  const cur = data[key] ?? {
    copy: 0,
    paste: 0,
    copyTypes: createEmptyTypeCounts(),
    pasteTypes: createEmptyTypeCounts()
  }
  const nextCopyTypes = { ...(cur.copyTypes ?? createEmptyTypeCounts()) }
  nextCopyTypes[type] += 1
  const next = {
    ...data,
    [key]: {
      ...cur,
      copy: cur.copy + 1,
      copyTypes: nextCopyTypes,
      pasteTypes: cur.pasteTypes ?? createEmptyTypeCounts()
    }
  }
  saveStatistics(next)
  return next
}

export function recordPaste(data: DailyData, type: ClipCategory): DailyData {
  // 今日のペースト回数を +1
  const key = toDateKey(new Date())
  const cur = data[key] ?? {
    copy: 0,
    paste: 0,
    copyTypes: createEmptyTypeCounts(),
    pasteTypes: createEmptyTypeCounts()
  }
  const nextPasteTypes = { ...(cur.pasteTypes ?? createEmptyTypeCounts()) }
  nextPasteTypes[type] += 1
  const next = {
    ...data,
    [key]: {
      ...cur,
      paste: cur.paste + 1,
      copyTypes: cur.copyTypes ?? createEmptyTypeCounts(),
      pasteTypes: nextPasteTypes
    }
  }
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
  // 集計結果を UI 表示用に整形
  const keys = Object.keys(data).sort()
  let totalCopy = 0
  let totalPaste = 0
  const copyTypes = createEmptyTypeCounts()
  const pasteTypes = createEmptyTypeCounts()
  keys.forEach((k) => {
    totalCopy += data[k].copy
    totalPaste += data[k].paste
    const copyByType = data[k].copyTypes ?? createEmptyTypeCounts()
    const pasteByType = data[k].pasteTypes ?? createEmptyTypeCounts()
    copyTypes.text += copyByType.text
    copyTypes.link += copyByType.link
    copyTypes.code += copyByType.code
    copyTypes.image += copyByType.image
    pasteTypes.text += pasteByType.text
    pasteTypes.link += pasteByType.link
    pasteTypes.code += pasteByType.code
    pasteTypes.image += pasteByType.image
  })

  // 直近30日の配列
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

  // 週次の集計（週の開始日をキーにする）
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
    monthly,
    copyTypes,
    pasteTypes
  }
}
