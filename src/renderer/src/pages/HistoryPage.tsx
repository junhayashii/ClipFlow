import { useMemo, useState } from 'react'
import { ClipboardItem, BookmarkItem } from '../types'
import {
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Search,
  Bookmark,
  Trash2,
  X
} from 'lucide-react'

interface Props {
  items: ClipboardItem[]
  bookmarks: BookmarkItem[]
  onCopy: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onAddBookmark: (content: string, timestamp?: number) => void
  onRemoveBookmark: (id: string) => void
}

type SmartFilter = 'all' | 'text' | 'link' | 'code' | 'image'

const FILTERS: Array<{ id: SmartFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'text', label: 'Text' },
  { id: 'link', label: 'Links' },
  { id: 'code', label: 'Code' },
  { id: 'image', label: 'Images' }
]

const CATEGORY_CONFIG = {
  text: {
    label: 'Text',
    icon: FileText,
    accent: 'text-slate-500 dark:text-slate-300',
    badgeClass: 'text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  },
  link: {
    label: 'Link',
    icon: Link2,
    accent: 'text-sky-600 dark:text-sky-300',
    badgeClass: 'text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-700'
  },
  code: {
    label: 'Code',
    icon: Code2,
    accent: 'text-amber-600 dark:text-amber-300',
    badgeClass: 'text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
  },
  image: {
    label: 'Image',
    icon: ImageIcon,
    accent: 'text-emerald-600 dark:text-emerald-300',
    badgeClass:
      'text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
  }
}

type SmartCategory = keyof typeof CATEGORY_CONFIG

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

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

function isLikelyUrl(value: string) {
  return URL_PATTERN.test(value.trim())
}

function isLikelyCode(value: string) {
  const text = value.trim()
  if (!text) return false

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const hasMultipleLines = lines.length >= 2

  // 1) インデントの深さ（行頭4スペース or タブ）
  const indentedLines = lines.filter((line) => /^(?:\t| {4,})\S+/.test(line)).length
  const indentRatio = lines.length > 0 ? indentedLines / lines.length : 0

  // 2) 予約語（キーワード）: 行頭のコード文のみカウント
  const keywordLines = lines.filter((line) =>
    KEYWORD_LINE_PATTERNS.some((pattern) => pattern.test(line))
  )
  const keywordScore = Math.min(2, keywordLines.length)

  // 3) 記号のペア（{} () [] がバランス）
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

  // 4) 行末の記号（; / : で終わる行が多い）
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

function getTextCategory(value: string): Exclude<SmartCategory, 'image'> {
  if (isLikelyUrl(value)) return 'link'
  if (isLikelyCode(value)) return 'code'
  return 'text'
}

function getItemCategory(item: ClipboardItem): SmartCategory {
  if (item.type === 'image') return 'image'
  return getTextCategory(item.content)
}

export default function HistoryPage({
  items,
  bookmarks,
  onCopy,
  onDelete,
  onAddBookmark,
  onRemoveBookmark
}: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SmartFilter>('all')
  const [previewItem, setPreviewItem] = useState<ClipboardItem | null>(null)

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        item,
        category: getItemCategory(item)
      })),
    [items]
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<SmartFilter, number> = {
      all: items.length,
      text: 0,
      link: 0,
      code: 0,
      image: 0
    }

    enrichedItems.forEach(({ category }) => {
      counts[category] += 1
    })

    return counts
  }, [enrichedItems, items.length])

  const filteredItems = enrichedItems.filter(({ item, category }) => {
    const matchesFilter =
      filter === 'all' || (filter === 'image' ? item.type === 'image' : category === filter)

    if (!matchesFilter) return false
    if (!query) return true

    const target = item.type === 'text' ? item.content : (item.filename ?? '')
    return target.toLowerCase().includes(query.toLowerCase())
  })

  const getBookmark = (content: string) => bookmarks.find((b) => b.content === content)

  const renderContent = (item: ClipboardItem, category: SmartCategory) => {
    if (item.type === 'image') {
      return (
        <div className="space-y-2">
          <div
            className="relative group/img overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 cursor-zoom-in"
            onClick={() => setPreviewItem(item)}
          >
            <img
              src={item.dataUrl}
              alt="Clipboard preview"
              className="max-h-[280px] w-auto object-contain transition-transform duration-700 group-hover/img:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xl transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
                <ExternalLink size={14} />
                Quick Look
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {item.filename ? item.filename : 'Image'} {item.width}x{item.height}
          </div>
        </div>
      )
    }

    if (category === 'link') {
      const url = normalizeUrl(item.content)
      return (
        <div className="max-h-40 overflow-y-auto pr-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-mono text-sky-700 dark:text-sky-300 break-all hover:underline bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-lg px-3 py-2 block"
          >
            {item.content.trim()}
          </a>
        </div>
      )
    }

    if (category === 'code') {
      return (
        <div className="max-h-52 overflow-auto pr-1">
          <pre className="text-sm font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/60 p-3">
            {item.content}
          </pre>
        </div>
      )
    }

    return (
      <div className="max-h-52 overflow-y-auto pr-1">
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-lg px-3 py-2">
          {item.content}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-5 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">History</h1>
        </div>
        <div className="relative w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
              filter === item.id
                ? 'text-slate-900 dark:text-slate-100 border-slate-900/60 dark:border-slate-100/60'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
            <span
              className={`ml-2 text-[10px] font-bold ${
                filter === item.id
                  ? 'text-slate-500 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {categoryCounts[item.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredItems.length === 0 ? (
          <div className="py-10 text-sm text-slate-500 dark:text-slate-400 text-center">
            該当する履歴がありません
          </div>
        ) : (
          filteredItems.map(({ item, category }) => {
            const bookmark = item.type === 'text' ? getBookmark(item.content) : undefined
            const CategoryIcon = CATEGORY_CONFIG[category].icon
            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    <CategoryIcon size={18} className={CATEGORY_CONFIG[category].accent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {CATEGORY_CONFIG[category].label}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {category === 'link' && item.type === 'text' && (
                          <button
                            onClick={() =>
                              window.open(
                                normalizeUrl(item.content),
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="リンクを開く"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}
                        {item.type === 'text' && (
                          <button
                            onClick={() =>
                              bookmark
                                ? onRemoveBookmark(bookmark.id)
                                : onAddBookmark(item.content, item.timestamp)
                            }
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title={bookmark ? 'ブックマークを解除' : 'ブックマークに追加'}
                          >
                            <Bookmark size={16} fill={bookmark ? 'currentColor' : 'none'} />
                          </button>
                        )}
                        <button
                          onClick={() => onCopy(item)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="コピー"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                          title="履歴から削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {renderContent(item, category)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {previewItem && previewItem.type === 'image' && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/90 backdrop-blur-xl transition-opacity duration-300"
          onClick={() => setPreviewItem(null)}
        >
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreviewItem(null)}
          >
            <X size={22} />
          </button>
          <div className="absolute top-6 left-6 flex gap-4">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20"
              onClick={(e) => {
                e.stopPropagation()
                onCopy(previewItem)
              }}
            >
              <Copy size={16} />
              Copy Image
            </button>
          </div>
          <img
            src={previewItem.dataUrl}
            alt="Full Preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
