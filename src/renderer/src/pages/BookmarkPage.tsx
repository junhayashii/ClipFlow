import { useState } from 'react'
import { BookmarkItem } from '../types'
import { Bookmark, Copy, Search, Trash2 } from 'lucide-react'

interface Props {
  items: BookmarkItem[]
  onCopy: (text: string) => void
  onRemoveBookmark: (id: string) => void
}

const BookmarkPage = ({ items, onCopy, onRemoveBookmark }: Props) => {
  // 検索用の入力値
  const [query, setQuery] = useState('')
  // テキストに対する検索フィルタ
  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-5 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bookmarks</h1>
        </div>

        <div className="relative w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredItems.length === 0 ? (
          // 空表示（検索結果なし or 未登録）
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            {items.length === 0
              ? '履歴のカードの★をクリックするとここに追加されます'
              : '該当するブックマークがありません'}
          </p>
        ) : (
          // ブックマーク一覧
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <Bookmark size={18} className="text-amber-500 dark:text-amber-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Bookmark
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onCopy(item.content)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="コピー"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(item.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                        title="ブックマークを解除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto pr-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-lg px-3 py-2">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BookmarkPage
