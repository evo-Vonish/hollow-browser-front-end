import { useState } from 'react'

interface Props {
  initial?: string
  onSubmit: (q: string) => void
  autoFocus?: boolean
  size?: 'lg' | 'sm'
}

/** 搜索输入框 —— 主页大框(lg) / 结果页顶栏小框(sm) */
export default function SearchBar({ initial = '', onSubmit, autoFocus, size = 'lg' }: Props) {
  const [q, setQ] = useState(initial)
  const big = size === 'lg'
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (q.trim()) onSubmit(q.trim())
      }}
      className={`flex w-full items-center gap-2 rounded-md border border-line bg-bg-1 transition-colors focus-within:border-signal ${
        big ? 'px-5 py-4' : 'px-3.5 py-2.5'
      }`}
    >
      <svg width={big ? 20 : 15} height={big ? 20 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="搜索…"
        className={`w-full bg-transparent text-ink-0 outline-none placeholder:text-ink-2 ${
          big ? 'text-[17px]' : 'text-[14px]'
        }`}
      />
      {q && (
        <button type="button" onClick={() => setQ('')} className="shrink-0 font-mono text-ink-2 transition-colors hover:text-ink-0" aria-label="清空">
          ×
        </button>
      )}
    </form>
  )
}
