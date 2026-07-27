import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Route, Routes, useSearchParams } from 'react-router-dom'
import Home from '@/pages/Home'
import Results from '@/pages/Results'
import Reader from '@/pages/Reader'

/**
 * 单路径门路由(主流搜索引擎式 URL 设计):
 *   /search           → 主页(输入框 + 标题)
 *   /search?q=...     → 搜索结果页
 *   /search?url=...   → 阅读模式(净化);url 与 q 可共存,q 用于"返回结果"
 */
function Gate() {
  const [params] = useSearchParams()
  if (params.get('url')) return <Reader />
  if (params.get('q')) return <Results />
  return <Home />
}

/** 渲染崩溃兜底:任何页面组件抛错时给诚实卡,而不是黑屏(2026-07-27 黑屏事故后的保险) */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[hollow-search] render crash:', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-0 px-4">
          <div className="w-full max-w-md rounded-md border border-line bg-bg-1 p-6">
            <p className="font-mono text-[13px] text-amber">页面渲染出错</p>
            <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink-2">
              {String(this.state.error).slice(0, 300)}
            </p>
            <a
              href="/search"
              className="mt-4 inline-block rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal"
            >
              ← 回主页
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg-0 text-ink-0">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Gate />} />
          <Route path="*" element={<Gate />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}
