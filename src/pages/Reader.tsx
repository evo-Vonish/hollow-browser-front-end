import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, fetchApiCached, hostOf } from '@/lib/api'
import type { FetchItem } from '@/lib/api'

type CleanState =
  | { kind: 'loading' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'ok'; item: FetchItem }

type Tab = 'web' | 'clean'

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

const CLEAN_STAGE = [
  '抓取 + 净化中…',
  'static 未出正文,正在启动浏览器渲染…',
  '仍在渲染/升级,反爬较重的站点会慢一些…',
]

/**
 * 阅读模式 —— 双路赛制:
 *   web  路:本地 iframe 直开原网页(用户浏览器渲染,Cookie 互通,与服务器无关)
 *   clean 路:/v1/fetch 云端净化正文
 * 两路同时加载,先就绪先展示;净化失败自动切原框;tab 无缝切换(两路都保持挂载)。
 */
export default function Reader() {
  const [params] = useSearchParams()
  const url = params.get('url') ?? ''
  const titleParam = params.get('title') ?? ''
  const backTo = `/?q=${encodeURIComponent(params.get('q') ?? '')}${params.get('scene') ? `&scene=${params.get('scene')}` : ''}${params.get('page') ? `&page=${params.get('page')}` : ''}`

  const [clean, setClean] = useState<CleanState>({ kind: 'loading' })
  const [webReady, setWebReady] = useState(false)
  const [tab, setTab] = useState<Tab | null>(null)
  const [stage, setStage] = useState(0)

  const cleanOk = clean.kind === 'ok' && clean.item.fetch_status === 'ok'
  const cleanFailed =
    clean.kind === 'error' || (clean.kind === 'ok' && clean.item.fetch_status !== 'ok')

  /* 净化路:与 iframe 同时发车 */
  useEffect(() => {
    if (!url) return
    let cancelled = false
    setClean({ kind: 'loading' })
    setWebReady(false)
    setTab(null)
    setStage(0)
    const t1 = setTimeout(() => !cancelled && setStage(1), 4000)
    const t2 = setTimeout(() => !cancelled && setStage(2), 10000)
    fetchApiCached(url)
      .then((d) => !cancelled && setClean({ kind: 'ok', item: d.items[0] }))
      .catch((e) =>
        !cancelled &&
        setClean({ kind: 'error', error: e instanceof ApiError ? e : new ApiError('未知错误', 'unknown', 0) }),
      )
    return () => {
      cancelled = true
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [url])

  /* 赛制裁决:先就绪先展示;净化失败自动切原框(仅在用户未手动选边时) */
  useEffect(() => {
    if (tab === null) {
      if (cleanOk) setTab('clean')
      else if (cleanFailed || webReady) setTab('web')
    }
  }, [tab, cleanOk, cleanFailed, webReady])

  const shown: Tab = tab ?? 'clean' // 未定前渲染 clean 骨架(iframe 也已在后台跑)

  return (
    <div className="flex h-screen flex-col">
      {/* 顶栏:返回 + 赛制 tab + 域名 + 原站 */}
      <header className="shrink-0 border-b border-line bg-bg-0/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
          <Link
            to={backTo}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal"
          >
            ← 返回
          </Link>

          {/* 赛制 tab */}
          <div className="flex rounded-md border border-line p-0.5">
            <button
              onClick={() => setTab('web')}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-[12px] transition-colors ${
                shown === 'web' ? 'bg-bg-2 text-ink-0' : 'text-ink-2 hover:text-ink-1'
              }`}
            >
              原网页
              {webReady && <span className="h-1.5 w-1.5 rounded-full bg-signal" title="已就绪" />}
            </button>
            <button
              onClick={() => setTab('clean')}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-[12px] transition-colors ${
                shown === 'clean' ? 'bg-bg-2 text-ink-0' : 'text-ink-2 hover:text-ink-1'
              }`}
            >
              净化阅读
              {cleanOk && <span className="h-1.5 w-1.5 rounded-full bg-signal" title="已就绪" />}
              {cleanFailed && <span className="font-mono text-[10px] text-amber">✕</span>}
            </button>
          </div>

          <span className="hidden truncate font-mono text-[11px] text-ink-2 sm:block">{hostOf(url)}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto shrink-0 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-cyan hover:text-cyan"
          >
            新标签打开 ↗
          </a>
        </div>
      </header>

      {/* 双路都保持挂载,切换只是显隐——无缝 */}
      <div className="relative flex-1 overflow-hidden">
        {/* web 路:本地 iframe(永远跑在用户浏览器,Cookie 互通;sandbox 禁顶跳防 frame-busting) */}
        <div className={`absolute inset-0 ${shown === 'web' ? '' : 'invisible'}`}>
          {!webReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-0">
              <p className="font-mono text-[13px] text-ink-2">原网页加载中<span className="animate-pulse">…</span></p>
              <p className="mt-2 max-w-xs text-center font-mono text-[11px] leading-relaxed text-ink-2/60">
                本地渲染 · Cookie 互通 · 与服务器无关<br />
                若一直空白:目标站可能禁止被嵌入(X-Frame-Options)或为 http 混合内容,请切净化阅读
              </p>
            </div>
          )}
          <iframe
            key={url}
            src={url}
            title="原网页"
            onLoad={() => setWebReady(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            className="h-full w-full border-0 bg-white"
          />
        </div>

        {/* clean 路:云端净化 */}
        <div className={`absolute inset-0 overflow-y-auto ${shown === 'clean' ? '' : 'invisible'}`}>
          <main className="mx-auto max-w-3xl px-4 py-8">
            {clean.kind === 'loading' && (
              <div className="pt-16 text-center">
                <p className="font-mono text-[13px] text-ink-2">
                  {CLEAN_STAGE[stage]}<span className="animate-pulse"> </span>
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-2/60">
                  static → dynamic → stealthy 升级链按需升档 · 原网页同时在本地加载,可手动切换
                </p>
              </div>
            )}

            {clean.kind === 'error' && (
              <CleanFailCard
                label="请求失败"
                detail={`[${clean.error.code}] ${clean.error.message}`}
                url={url}
                onSwitch={() => setTab('web')}
              />
            )}

            {clean.kind === 'ok' &&
              (clean.item.fetch_status === 'ok' ? (
                <article>
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${TIER_STYLE[clean.item.engine_used]?.cls ?? ''}`}>
                      {TIER_STYLE[clean.item.engine_used]?.label ?? clean.item.engine_used}
                    </span>
                    <span className="font-mono text-[11px] text-ink-2">{clean.item.word_count} 字符 · 净化阅读模式</span>
                  </div>

                  <h1 className="font-display text-[26px] font-bold leading-snug text-ink-0">
                    {clean.item.title || titleParam || clean.item.url}
                  </h1>

                  {clean.item.highlights.length > 0 && (
                    <div className="mt-6 rounded-md border border-line bg-bg-1 p-4">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-signal">要点</p>
                      <ul className="mt-2 space-y-1.5">
                        {clean.item.highlights.map((h, i) => (
                          <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-1">
                            <span className="shrink-0 font-mono text-signal/70">{i + 1}.</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 space-y-4">
                    {(clean.item.content ?? '').split(/\n{2,}/).map((para, i) => (
                      <p key={i} className="text-[15px] leading-[1.9] text-ink-1">{para}</p>
                    ))}
                  </div>
                </article>
              ) : (
                <CleanFailCard
                  label={STATUS_LABEL[clean.item.fetch_status] ?? clean.item.fetch_status}
                  detail={clean.item.error ?? '(无错误详情)'}
                  url={url}
                  onSwitch={() => setTab('web')}
                />
              ))}
          </main>
        </div>
      </div>
    </div>
  )
}

/** 净化失败的诚实卡:自动切换已发生时也作为留档说明 */
function CleanFailCard({ label, detail, url, onSwitch }: { label: string; detail: string; url: string; onSwitch: () => void }) {
  return (
    <div className="rounded-md border border-line bg-bg-1 p-6">
      <p className="font-mono text-[13px] text-amber">{label}</p>
      <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink-2">{detail}</p>
      <p className="mt-3 text-[13px] text-ink-2">净化路如实回报——原网页路(本地渲染、Cookie 互通)通常能开。</p>
      <div className="mt-4 flex gap-3">
        <button onClick={onSwitch} className="rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-signal hover:text-signal">
          切到原网页
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="rounded-md border border-line px-4 py-1.5 text-[13px] text-ink-1 transition-colors hover:border-cyan hover:text-cyan">
          新标签打开 ↗
        </a>
      </div>
    </div>
  )
}
