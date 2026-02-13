import type { ClipboardItem } from './clipboardTypes'
import type { ClipCategory } from './statisticsStore'

const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i
const KEYWORD_LINE_PATTERNS = [
  /^\s*(?:async\s+)?function\b/i,
  /^\s*(?:const|let|var)\s+\w+/i,
  /^\s*import\s+.+/i,
  /^\s*export\s+.+/i,
  /^\s*def\s+\w+/i,
  /^\s*public\s+class\s+\w+/i,
  /^\s*class\s+\w+/i,
  /^\s*if\s*\(/i,
  /^\s*else\s*\{/i,
  /^\s*return\b/i,
  /^\s*#include\b/i
]

function isLikelyUrl(value: string) {
  return URL_PATTERN.test(value.trim())
}

function isLikelyCode(value: string) {
  const text = value.trim()
  if (!text) return false

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const hasMultipleLines = lines.length >= 2

  const indentedLines = lines.filter((line) => /^(?:\t| {4,})\S+/.test(line)).length
  const indentRatio = lines.length > 0 ? indentedLines / lines.length : 0

  const keywordLines = lines.filter((line) =>
    KEYWORD_LINE_PATTERNS.some((pattern) => pattern.test(line))
  )
  const keywordScore = Math.min(2, keywordLines.length)

  const pairCounts = [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '[', close: ']' }
  ].map(({ open, close }) => ({
    open: (text.match(new RegExp(`\\${open}`, 'g')) ?? []).length,
    close: (text.match(new RegExp(`\\${close}`, 'g')) ?? []).length
  }))

  const balancedPairs = pairCounts.filter((pair) => pair.open > 0 && pair.open === pair.close)
  const pairScore = balancedPairs.length >= 2 ? 2 : balancedPairs.length >= 1 ? 1 : 0

  const lineEndSymbols = lines.filter((line) => /[;:]$/.test(line.trim())).length
  const lineEndRatio = lines.length > 0 ? lineEndSymbols / lines.length : 0
  const lineEndScore = lineEndRatio >= 0.4 ? 2 : lineEndRatio >= 0.2 ? 1 : 0

  const hasStructuralSignal = indentRatio >= 0.1 || keywordScore > 0 || lineEndScore > 0
  if (!hasStructuralSignal) return false

  let score = 0
  if (indentRatio >= 0.3) score += 2
  else if (indentRatio >= 0.1) score += 1

  score += keywordScore
  score += pairScore
  score += lineEndScore

  if (hasMultipleLines) return score >= 3
  return score >= 4
}

export function classifyTextContent(value: string): ClipCategory {
  if (isLikelyUrl(value)) return 'link'
  if (isLikelyCode(value)) return 'code'
  return 'text'
}

export function classifyClipboardItem(item: ClipboardItem): ClipCategory {
  if (item.type === 'image') return 'image'
  return classifyTextContent(item.content)
}
