import { useState } from 'react'
import { ClipboardItem, BookmarkItem } from '../types'
import { Copy, Star, Trash2 } from 'lucide-react'

interface Props {
  items: ClipboardItem[]
  bookmarks: BookmarkItem[]
  onCopy: (text: string) => void
  onDelete: (content: string) => void
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
  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(query.toLowerCase())
  )

  const getBookmark = (content: string) => bookmarks.find((b) => b.content === content)

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">History</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search history..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200
               bg-white
               text-slate-900
               placeholder:text-slate-400
               focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredItems.map((item) => {
          const bookmark = getBookmark(item.content)
          return (
            <div
              key={item.id}
              className="group bg-white dark:bg-neutral-800 border border-slate-200 rounded-xl p-4 hover:shadow transition"
            >
              <div className="flex justify-between items-start gap-4">
                <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap line-clamp-3">
                  {item.content}
                </pre>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => (bookmark ? onRemoveBookmark(bookmark.id) : onAddBookmark(item.content, item.timestamp))}
                    className="text-slate-400 hover:text-amber-500"
                    title={bookmark ? 'ブックマークを解除' : 'ブックマークに追加'}
                  >
                    <Star
                      size={16}
                      className={bookmark ? 'fill-amber-500 text-amber-500' : ''}
                    />
                  </button>
                  <button
                    onClick={() => onCopy(item.content)}
                    className="text-slate-400 hover:text-sky-500"
                    title="コピー"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item.content)}
                    className="text-slate-400 hover:text-red-500"
                    title="履歴から削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-400">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
