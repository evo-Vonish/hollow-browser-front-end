import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'
import ModeTabs from '@/components/ModeTabs'

interface Props {
  q: string
  mode: 'search' | 'research'
  /** 模式切换目标 URL 构造(保留 scene/filters) */
  buildModeUrl: (mode: 'search' | 'research') => string
  onSearch: (q: string) => void
  searching?: boolean
  /** 第二行内容(场景 chips / 工具栏) */
  children?: ReactNode
}

/** Results / Research 共用顶栏:标 + 搜索框 + 模式 tab + 第二行插槽 */
export default function AppHeader({ q, mode, buildModeUrl, onSearch, searching, children }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 font-display text-[18px] font-bold tracking-tight text-signal" aria-label="回主页">
          HOLLOW
        </Link>
        <ModeTabs mode={mode} buildUrl={buildModeUrl} />
        <div className="min-w-0 flex-1">
          <SearchBar initial={q} onSubmit={onSearch} size="sm" loading={searching} />
        </div>
      </div>
      {children && <div className="mx-auto max-w-3xl space-y-2.5 px-4 pb-2.5">{children}</div>}
    </header>
  )
}
