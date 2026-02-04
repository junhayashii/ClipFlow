import { useState } from 'react'
import { ClipboardItem, BookmarkItem } from '../types'
import { Copy, Star, Trash2 } from 'lucide-react'

interface Props {
  items: ClipboardItem[]
  bookmarks: BookmarkItem[]
  onCopy: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onAddBookmark: (content: string, timestamp?: number) => void
  onRemoveBookmark: (id: string) => void
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
  const filteredItems = items.filter((item) => {
    if (!query) return true
    if (item.type === 'text') {
      return item.content.toLowerCase().includes(query.toLowerCase())
    }
    return false
  })

  const getBookmark = (content: string) => bookmarks.find((b) => b.content === content)

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">History</h1>
        <div>
          <input
            type="text"
            placeholder="Search history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
               bg-white dark:bg-slate-800
               text-slate-900 dark:text-slate-100
               placeholder:text-slate-400 dark:placeholder:text-slate-500
               focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredItems.map((item) => {
          const bookmark = item.type === 'text' ? getBookmark(item.content) : undefined
          return (
            <div
              key={item.id}
              className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:shadow transition"
            >
              <div className="flex justify-between items-start gap-4">
                {item.type === 'text' ? (
                  <pre className="text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">
                    {item.content}
                  </pre>
                ) : (
                  <div className="flex-1 space-y-2">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2">
                      <img
                        src={item.dataUrl}
                        alt="Clipboard preview"
                        className="max-h-48 w-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.filename ? item.filename : 'Image'} {item.width}x{item.height}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                  {item.type === 'text' && (
                    <button
                      onClick={() =>
                        bookmark
                          ? onRemoveBookmark(bookmark.id)
                          : onAddBookmark(item.content, item.timestamp)
                      }
                      className="text-slate-400 hover:text-amber-500"
                      title={bookmark ? 'ブックマークを解除' : 'ブックマークに追加'}
                    >
                      <Star
                        size={16}
                        className={bookmark ? 'fill-amber-500 text-amber-500' : ''}
                      />
                    </button>
                  )}
                  <button
                    onClick={() => onCopy(item)}
                    className="text-slate-400 hover:text-sky-500"
                    title="コピー"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-slate-400 hover:text-red-500"
                    title="履歴から削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
