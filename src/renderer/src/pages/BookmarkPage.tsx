import { useState } from 'react'
import { BookmarkItem } from '../types'
import { Copy, Star } from 'lucide-react'

interface Props {
  items: BookmarkItem[]
  onCopy: (text: string) => void
  onRemoveBookmark: (id: string) => void
}

const BookmarkPage = ({ items, onCopy, onRemoveBookmark }: Props) => {
  const [query, setQuery] = useState('')
  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-4">Bookmarks</h1>
      <p className="text-sm text-slate-500 mb-4">
        履歴は最大件数を超えると消えますが、ブックマークは残ります。
      </p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search bookmarks..."
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
        {filteredItems.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            {items.length === 0
              ? '履歴のカードの★をクリックするとここに追加されます'
              : '該当するブックマークがありません'}
          </p>
        ) : (
          filteredItems.map((item) => (
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
                    onClick={() => onRemoveBookmark(item.id)}
                    className="text-slate-400 hover:text-amber-500"
                    title="ブックマークを解除"
                  >
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                  </button>
                  <button
                    onClick={() => onCopy(item.content)}
                    className="text-slate-400 hover:text-sky-500"
                    title="コピー"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-400">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BookmarkPage
