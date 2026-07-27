/**
 * HOLLOW API 客户端 —— 同源调用(hollow.vonish.dev/search → hollow.vonish.dev/v1/*,无 CORS)。
 * 契约见 https://hollow.vonish.dev/docs/api 与 /docs/api-params。
 */

export interface SearchResultItem {
  url: string
  title: string
  snippet: string
  engine: string
  score: number
  relevance: number
  published_date: string | null
}

export interface SearchLedger {
  engines_used: string[]
  engines_failed: Record<string, string>
  engines_no_results: string[]
  took_ms?: number
  q_sanitized?: boolean
  results_total?: number
}

export interface SearchResponse {
  results: SearchResultItem[]
  engines: string[]
  page: number
  search: SearchLedger
  answers: { answer?: string; url?: string }[]
  ignored_params?: string[]
}

export interface FetchItem {
  url: string
  final_url?: string | null
  fetch_status: 'ok' | 'failed' | 'timeout' | 'blocked' | 'no_content'
  engine_used: 'static' | 'dynamic' | 'stealthy'
  http_status: number | null
  title: string | null
  content: string | null
  highlights: string[]
  highlight_scores: number[]
  word_count: number
  error: string | null
}

export interface FetchResponse {
  items: FetchItem[]
  fetch: { ok: number; failed: number; timeout: number; blocked: number; no_content: number; took_ms: number }
  ignored_params?: string[]
}

export class ApiError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let resp: Response
  try {
    resp = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    throw new ApiError(e instanceof DOMException && e.name === 'AbortError' ? '请求超时(客户端)' : '网络不可达', 'client_error', 0)
  }
  clearTimeout(timer)
  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    const err = (data as { error?: { message?: string; code?: string } } | null)?.error
    throw new ApiError(err?.message ?? `HTTP ${resp.status}`, err?.code ?? 'unknown', resp.status)
  }
  return data as T
}

export function searchApi(query: string, scenes: string[], page: number): Promise<SearchResponse> {
  return post<SearchResponse>('/v1/search', {
    query,
    ...(scenes.length ? { scenes } : {}),
    page,
  }, 30000)
}

export function fetchApi(url: string): Promise<FetchResponse> {
  // 阅读模式:单 URL 直取,budget 45s 覆盖升级链;正文截 2 万字符够读
  return post<FetchResponse>('/v1/fetch', {
    urls: url,
    budget: 45,
    max_content_chars: 20000,
  }, 60000)
}

/* ---------- 会话缓存(延迟优化:hover 预取 + 二次打开秒开) ---------- */

const CACHE_TTL = 10 * 60 * 1000 // 10 分钟
const CACHE_PREFIX = 'hollow:'
const inflight = new Map<string, Promise<unknown>>()

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { t, v } = JSON.parse(raw) as { t: number; v: T }
    return Date.now() - t < CACHE_TTL ? v : null
  } catch {
    return null
  }
}

function cacheSet(key: string, v: unknown) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v }))
  } catch {
    // 超容量:清掉最旧的一半再试
    try {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(CACHE_PREFIX))
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => sessionStorage.removeItem(k))
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v }))
    } catch {
      /* 放弃缓存,不影响功能 */
    }
  }
}

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending
  const p = fn()
    .then((v) => {
      cacheSet(key, v)
      inflight.delete(key)
      return v
    })
    .catch((e) => {
      inflight.delete(key)
      throw e
    })
  inflight.set(key, p)
  return p
}

export function searchApiCached(query: string, scenes: string[], page: number): Promise<SearchResponse> {
  return cached(`s:${query}:${scenes.join(',')}:${page}`, () => searchApi(query, scenes, page))
}

export function fetchApiCached(url: string): Promise<FetchResponse> {
  return cached(`f:${url}`, () => fetchApi(url))
}

/** hover/focus 预取:结果卡悬停时后台净化,点击秒开(结果丢弃,仅暖缓存) */
export function prefetchFetch(url: string) {
  if (!cacheGet(`f:${url}`) && !inflight.has(`f:${url}`)) {
    fetchApiCached(url).catch(() => undefined)
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** 场景 chip 定义:id 对应后端 scenes 参数,''= 默认集 */
export const SCENES: { id: string; label: string }[] = [
  { id: '', label: '全部' },
  { id: 'zh', label: '中文' },
  { id: 'dev', label: '开发' },
  { id: 'academic', label: '学术' },
  { id: 'news', label: '新闻' },
  { id: 'social', label: '社区' },
  { id: 'knowledge', label: '百科' },
  { id: 'general', label: '通用' },
  { id: 'images', label: '图片' },
  { id: 'av', label: '视频' },
]
