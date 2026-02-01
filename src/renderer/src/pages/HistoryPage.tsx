import { useState } from 'react'
import { ClipboardItem } from '../types'
import { Copy } from 'lucide-react'

interface Props {
  items: ClipboardItem[]
  onCopy: (text: string) => void
}

export default function HistoryPage({ items, onCopy }: Props) {
  const [query, setQuery] = useState('')
  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(query.toLowerCase())
  )

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
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white dark:bg-neutral-800 border border-slate-200 rounded-xl p-4 hover:shadow transition"
          >
            <div className="flex justify-between items-start gap-4">
              <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap line-clamp-3">
                {item.content}
              </pre>

              <button
                onClick={() => onCopy(item.content)}
                className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-sky-500"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="mt-2 text-[10px] text-slate-400">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
