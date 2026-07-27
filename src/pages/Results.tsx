import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'
import SceneChips from '@/components/SceneChips'
import { ApiError, hostOf, searchApi } from '@/lib/api'
import type { SearchResponse } from '@/lib/api'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'ok'; data: SearchResponse }

function Skeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 w-2/3 rounded bg-bg-2" />
          <div className="mt-2 h-3 w-1/4 rounded bg-bg-2" />
          <div className="mt-2 h-3 w-full rounded bg-bg-2" />
        </div>
      ))}
    </div>
  )
}

export default function Results() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const scene = params.get('scene') ?? ''
  const page = Math.max(1, Math.min(20, Number(params.get('page') ?? '1') || 1))
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!q) return
    let cancelled = false
    setState({ kind: 'loading' })
    searchApi(q, scene ? [scene] : [], page)
      .then((data) => !cancelled && setState({ kind: 'ok', data }))
      .catch((e) => !cancelled && setState({ kind: 'error', error: e instanceof ApiError ? e : new ApiError('未知错误', 'unknown', 0) }))
    return () => {
      cancelled = true
    }
  }, [q, scene, page])

  const go = (nextQ: string, nextScene = scene, nextPage = 1) => {
    setParams({ q: nextQ, ...(nextScene ? { scene: nextScene } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) })
  }

  const readUrl = (url: string, title: string) =>
    `/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&q=${encodeURIComponent(q)}${scene ? `&scene=${scene}` : ''}${page > 1 ? `&page=${page}` : ''}`

  const failedCount = state.kind === 'ok' ? Object.keys(state.data.search.engines_failed).length : 0

  return (
    <div className="min-h-screen">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg-0/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link to="/" className="shrink-0 font-display text-[18px] font-bold tracking-tight text-signal" aria-label="回主页">
            HOLLOW
          </Link>
          <SearchBar initial={q} onSubmit={(next) => go(next)} size="sm" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-2.5">
          <SceneChips value={scene} onChange={(s) => go(q, s)} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {state.kind === 'loading' && <Skeleton />}

        {state.kind === 'error' && (
          <div className="rounded-md border border-line bg-bg-1 p-6">
            <p className="font-mono text-[13px] text-amber">
              {state.error.status === 429 ? '网关繁忙(在飞闸已满)——按 Retry-After 稍后重试' : '搜索失败'}
            </p>
            <p className="mt-2 break-all font-mono text-[12px] text-ink-2">
              [{state.error.code}] {state.error.message}
            </p>
            <button
              onClick={() => go(q, scene, page)}
              className="mt-4 rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal"
            >
              重试
            </button>
          </div>
        )}

        {state.kind === 'ok' && (
          <>
            {/* 账目行 */}
            <p className="mb-5 font-mono text-[11px] text-ink-2">
              {state.data.results.length} 条结果 · 引擎 {state.data.search.engines_used.length} 用
              {failedCount > 0 && <span className="text-amber"> / {failedCount} 失败</span>}
              {state.data.search.engines_no_results.length > 0 && ` / ${state.data.search.engines_no_results.length} 零结果`}
              {state.data.search.q_sanitized && ' · bang 已清洗'}
            </p>

            {/* infobox 即时答案 */}
            {state.data.answers.length > 0 && state.data.answers[0].answer && (
              <div className="mb-6 rounded-md border border-signal/30 bg-signal/5 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-signal">即时答案</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-1">{state.data.answers[0].answer}</p>
              </div>
            )}

            {state.data.results.length === 0 && (
              <div className="rounded-md border border-line bg-bg-1 p-6 text-[14px] text-ink-2">
                没有召回结果。换个场景或关键词试试——引擎零结果/失败已在上面的账目行如实列出。
              </div>
            )}

            {/* 结果卡 */}
            <ol className="space-y-6">
              {state.data.results.map((r, i) => (
                <li key={`${r.url}-${i}`}>
                  <button
                    onClick={() => navigate(readUrl(r.url, r.title))}
                    className="group block w-full text-left"
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-bg-2 text-[9px] text-ink-1">
                        {hostOf(r.url).replace(/^www\./, '')[0]?.toUpperCase()}
                      </span>
                      {hostOf(r.url)}
                      <span className="text-signal/70">· {r.engine}</span>
                      {r.published_date && <span>· {r.published_date.slice(0, 10)}</span>}
                    </span>
                    <span className="mt-1 block text-[17px] leading-snug text-cyan transition-colors group-hover:text-signal group-hover:underline">
                      {r.title || r.url}
                    </span>
                    {r.snippet && (
                      <span className="mt-1 block text-[13px] leading-relaxed text-ink-1">
                        {r.snippet.length > 220 ? r.snippet.slice(0, 220) + '…' : r.snippet}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>

            {/* 分页 */}
            {state.data.results.length > 0 && (
              <div className="mt-10 flex items-center justify-center gap-3 font-mono text-[12px]">
                {page > 1 ? (
                  <button onClick={() => go(q, scene, page - 1)} className="rounded-md border border-line px-4 py-1.5 text-ink-1 transition-colors hover:border-signal hover:text-signal">
                    ← 上一页
                  </button>
                ) : (
                  <span className="px-4 py-1.5 text-ink-2/50">← 上一页</span>
                )}
                <span className="text-ink-2">{page} / 20</span>
                {page < 20 ? (
                  <button onClick={() => go(q, scene, page + 1)} className="rounded-md border border-line px-4 py-1.5 text-ink-1 transition-colors hover:border-signal hover:text-signal">
                    下一页 →
                  </button>
                ) : (
                  <span className="px-4 py-1.5 text-ink-2/50">下一页 →</span>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
