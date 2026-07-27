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
