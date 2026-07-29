import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, FileText, FlaskConical, Zap } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import SceneChips from '@/components/SceneChips'

/** 主页 —— 标题 + 输入框 + 场景 chips(主流引擎式单页) */
export default function Home() {
  const navigate = useNavigate()
  const [scene, setScene] = useState('')

  const go = (q: string) => {
    navigate(`/?q=${encodeURIComponent(q)}${scene ? `&scene=${scene}` : ''}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
        {/* HOLLOW 衬线描边字标 */}
        <h1
          className="select-none font-display text-[64px] font-bold leading-none tracking-tight sm:text-[88px]"
          style={{ WebkitTextStroke: '1.5px #2E7D5B', color: 'transparent' }}
        >
          HOLLOW
        </h1>
        <p className="mt-5 text-center text-[14px] text-ink-2">
          343 源召回 · 三档抓取 · 净化阅读
        </p>

        <div className="mt-10 w-full max-w-xl">
          <SearchBar onSubmit={go} autoFocus size="lg" />
          <div className="mt-4 flex justify-center">
            <SceneChips value={scene} onChange={setScene} />
          </div>
        </div>

        {/* 三能力入口 */}
        <div className="mt-10 grid w-full max-w-xl grid-cols-3 gap-2 max-sm:grid-cols-1">
          <Capability
            icon={<Zap className="size-4 text-signal" />}
            title="搜索 + 净化阅读"
            desc="点开结果即云端净化,与原网页双路赛制"
          />
          <Capability
            icon={<FlaskConical className="size-4 text-cyan" />}
            title="深研模式"
            desc="搜索+抓取+净化全套,SSE 逐条流式抵达"
          />
          <Capability
            icon={<Database className="size-4 text-violet" />}
            title="引擎注册表"
            desc="343 源账目全透明,可点名可审计"
            href="/?engines"
          />
        </div>

        <p className="mt-8 font-mono text-[11px] text-ink-2">
          回车即搜 · <kbd className="rounded border border-line px-1">/</kbd> 聚焦输入框 · 服务路径上零模型调用
        </p>
      </main>

      <footer className="flex items-center justify-center gap-4 pb-6 font-mono text-[11px] text-ink-2">
        <a href="/docs" className="inline-flex items-center gap-1 transition-colors hover:text-signal">
          <FileText className="size-3" />
          文档
        </a>
        <span>·</span>
        <a href="/docs/api" className="transition-colors hover:text-signal">API</a>
        <span>·</span>
        <span>AGPL-3.0 · self-hosted</span>
      </footer>
    </div>
  )
}

function Capability({ icon, title, desc, href }: { icon: React.ReactNode; title: string; desc: string; href?: string }) {
  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-[13px] text-ink-0">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{desc}</p>
    </>
  )
  const cls = 'rounded-md border border-line bg-bg-1 p-3.5 text-left transition-colors hover:border-line-strong'
  return href ? (
    /* 站内链接必须走 Link:裸 <a> 会绕过 basename=/search 跳到域根 */
    <Link to={href} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
