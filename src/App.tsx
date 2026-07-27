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

export default function App() {
  return (
    <div className="min-h-screen bg-bg-0 text-ink-0">
      <Routes>
        <Route path="/" element={<Gate />} />
        <Route path="*" element={<Gate />} />
      </Routes>
    </div>
  )
}
