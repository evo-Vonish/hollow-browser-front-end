import { Check } from 'lucide-react'
import type { SearchResultItem } from '@/lib/sdk'
import { hostInitial, prefetchFetch, shortHost, truncate } from '@/lib/sdk'
import { cn } from '@/lib/utils'

interface Props {
  item: SearchResultItem
  /** 点击进入阅读模式 */
  onOpen: (url: string, title: string) => void
  /** 批量选择态(不传则不显示勾选) */
  selected?: boolean
  onToggleSelect?: (url: string) => void
}

/** 搜索结果卡:hover/focus/触摸预取净化,点击秒开;支持批量多选 */
export default function ResultCard({ item: r, onOpen, selected, onToggleSelect }: Props) {
  return (
    <li className="group relative">
      {onToggleSelect && (
        <button
          type="button"
          onClick={() => onToggleSelect(r.url)}
          aria-label={selected ? '取消选择' : '选择'}
          aria-pressed={selected}
          className={cn(
            'absolute -left-9 top-1 flex size-5 items-center justify-center rounded border transition-colors',
            'max-lg:hidden',
            selected
              ? 'border-signal bg-signal text-[#F7F5EF]'
              : 'border-line bg-bg-1 text-transparent hover:border-line-strong',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </button>
      )}
      <button
        onClick={() => onOpen(r.url, r.title)}
        onMouseEnter={() => prefetchFetch(r.url)}
        onFocus={() => prefetchFetch(r.url)}
        onTouchStart={() => prefetchFetch(r.url)}
        className="block w-full text-left"
      >
        <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
          <span className="inline-flex size-4 items-center justify-center rounded-sm bg-bg-2 text-[9px] text-ink-1">
            {hostInitial(r.url)}
          </span>
          <span className="truncate">{shortHost(r.url)}</span>
          <span className="shrink-0 text-signal/70">· {r.engine}</span>
          {r.published_date && <span className="shrink-0">· {r.published_date.slice(0, 10)}</span>}
        </span>
        <span className="mt-1.5 block font-serif text-[18px] leading-snug text-cyan transition-colors group-hover:underline">
          {r.title || r.url}
        </span>
        {r.snippet && (
          <span className="mt-1.5 block text-[13.5px] leading-relaxed text-ink-1">
            {truncate(r.snippet, 220)}
          </span>
        )}
      </button>
    </li>
  )
}
