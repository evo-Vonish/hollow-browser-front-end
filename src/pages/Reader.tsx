import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, fetchApi, hostOf } from '@/lib/api'
import type { FetchItem } from '@/lib/api'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'ok'; item: FetchItem }

const TIER_STYLE: Record<string, { label: string; cls: string }> = {
  static: { label: 'static · 静态直取', cls: 'text-signal border-signal/40 bg-signal/10' },
  dynamic: { label: 'dynamic · 浏览器渲染', cls: 'text-cyan border-cyan/40 bg-cyan/10' },
  stealthy: { label: 'stealthy · 反检测', cls: 'text-amber border-amber/40 bg-amber/10' },
}

const STATUS_LABEL: Record<string, string> = {
  failed: '抓取失败',
  timeout: '抓取超时',
  blocked: '被目标站拦截',
  no_content: '净化不出正文',
}

/** 阅读模式 —— /v1/fetch 净化后的干净正文 + 返回结果 */
export default function Reader() {
  const [params] = useSearchParams()
  const url = params.get('url') ?? ''
  const titleParam = params.get('title') ?? ''
  const backTo = `/results?q=${encodeURIComponent(params.get('q') ?? '')}${params.get('scene') ? `&scene=${params.get('scene')}` : ''}${params.get('page') ? `&page=${params.get('page')}` : ''}`
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!url) return
    let cancelled = false
    setState({ kind: 'loading' })
    fetchApi(url)
      .then((d) => !cancelled && setState({ kind: 'ok', item: d.items[0] }))
      .catch((e) => !cancelled && setState({ kind: 'error', error: e instanceof ApiError ? e : new ApiError('未知错误', 'unknown', 0) }))
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div className="min-h-screen">
      {/* 顶栏:返回 + 域名 + 原站 */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg-0/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to={backTo}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal"
          >
            ← 返回结果
          </Link>
          <span className="truncate font-mono text-[11px] text-ink-2">{hostOf(url)}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto shrink-0 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-cyan hover:text-cyan"
          >
            打开原网页 ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {state.kind === 'loading' && (
          <div className="pt-16 text-center">
            <p className="font-mono text-[13px] text-ink-2">
              抓取 + 净化中<span className="animate-pulse">…</span>
            </p>
            <p className="mt-2 font-mono text-[11px] text-ink-2/60">static → dynamic → stealthy 升级链按需升档</p>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="rounded-md border border-line bg-bg-1 p-6">
            <p className="font-mono text-[13px] text-amber">请求失败</p>
            <p className="mt-2 break-all font-mono text-[12px] text-ink-2">[{state.error.code}] {state.error.message}</p>
            <a href={url} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-cyan hover:text-cyan">
              直接打开原网页 ↗
            </a>
          </div>
        )}

        {state.kind === 'ok' && (
          <>
            {state.item.fetch_status === 'ok' ? (
              <article>
                {/* 元信息 */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${TIER_STYLE[state.item.engine_used]?.cls ?? ''}`}>
                    {TIER_STYLE[state.item.engine_used]?.label ?? state.item.engine_used}
                  </span>
                  <span className="font-mono text-[11px] text-ink-2">
                    {state.item.word_count} 字符 · 净化阅读模式
                  </span>
                </div>

                <h1 className="font-display text-[26px] font-bold leading-snug text-ink-0">
                  {state.item.title || titleParam || state.item.url}
                </h1>

                {/* highlights 要点 */}
                {state.item.highlights.length > 0 && (
                  <div className="mt-6 rounded-md border border-line bg-bg-1 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-signal">要点</p>
                    <ul className="mt-2 space-y-1.5">
                      {state.item.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-1">
                          <span className="shrink-0 font-mono text-signal/70">{i + 1}.</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 净化正文 */}
                <div className="mt-8 space-y-4">
                  {(state.item.content ?? '').split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="text-[15px] leading-[1.9] text-ink-1">{para}</p>
                  ))}
                </div>
              </article>
            ) : (
              /* 失败诚实卡 */
              <div className="rounded-md border border-line bg-bg-1 p-6">
                <p className="font-mono text-[13px] text-amber">
                  {STATUS_LABEL[state.item.fetch_status] ?? state.item.fetch_status}
                </p>
                <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink-2">
                  {state.item.error ?? '(无错误详情)'}
                </p>
                <p className="mt-3 text-[13px] text-ink-2">
                  这是净化模式的如实回报——可以尝试直接打开原网页。
                </p>
                <div className="mt-4 flex gap-3">
                  <a href={url} target="_blank" rel="noreferrer" className="rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-cyan hover:text-cyan">
                    打开原网页 ↗
                  </a>
                  <Link to={backTo} className="rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal">
                    ← 返回结果
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
