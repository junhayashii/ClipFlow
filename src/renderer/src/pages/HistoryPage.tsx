export default function HistoryPage({
  history,
  onSelect
}: {
  history: string[]
  onSelect: (text: string) => void
}) {
  if (history.length === 0) {
    return <div>まだコピー履歴はありません</div>
  }

  return (
    <ul>
      {history.map((item, i) => (
        <li key={i} onClick={() => onSelect(item)} style={{ cursor: 'pointer', padding: '8px 0' }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{item}</pre>
        </li>
      ))}
    </ul>
  )
}
