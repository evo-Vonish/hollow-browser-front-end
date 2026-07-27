import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'
import SceneChips from '@/components/SceneChips'

/** 主页 —— 标题 + 输入框 + 场景 chips(Google 式单页) */
export default function Home() {
  const navigate = useNavigate()
  const [scene, setScene] = useState('')

  const go = (q: string) => {
    navigate(`/?q=${encodeURIComponent(q)}${scene ? `&scene=${scene}` : ''}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
        {/* HOLLOW 描边字标 */}
        <h1
          className="select-none font-display text-[64px] font-bold leading-none tracking-tight sm:text-[88px]"
          style={{ WebkitTextStroke: '1.5px #34D399', color: 'transparent' }}
        >
          HOLLOW
        </h1>
        <p className="mt-4 text-center text-[14px] text-ink-2">
          343 源召回 · 三档抓取 · 净化阅读 —— 自托管深度研究 API 的搜索界面
        </p>

        <div className="mt-10 w-full max-w-xl">
          <SearchBar onSubmit={go} autoFocus size="lg" />
          <div className="mt-4 flex justify-center">
            <SceneChips value={scene} onChange={setScene} />
          </div>
        </div>

        <p className="mt-8 font-mono text-[11px] text-ink-2">
          输入回车即搜 · 点开结果进入净化阅读模式 · 服务路径上零模型调用
        </p>
      </main>

      <footer className="flex items-center justify-center gap-4 pb-6 font-mono text-[11px] text-ink-2">
        <a href="/docs" className="transition-colors hover:text-signal">文档</a>
        <span>·</span>
        <a href="/docs/api" className="transition-colors hover:text-signal">API</a>
        <span>·</span>
        <span>AGPL-3.0 · self-hosted</span>
      </footer>
    </div>
  )
}
