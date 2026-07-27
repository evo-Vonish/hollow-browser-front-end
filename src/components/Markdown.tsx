import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown 渲染 —— 净化正文(trafilatura output_format=markdown)的排版层。
 * GFM 表格/删除线/任务列表支持;链接一律新标签;样式对齐站点设计令牌。
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-3 mt-8 font-display text-[22px] font-bold text-ink-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-3 mt-7 font-display text-[19px] font-bold text-ink-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-6 font-display text-[16px] font-bold text-ink-0">{children}</h3>,
        h4: ({ children }) => <h4 className="mb-2 mt-5 text-[15px] font-bold text-ink-0">{children}</h4>,
        p: ({ children }) => <p className="my-4 text-[15px] leading-[1.9] text-ink-1">{children}</p>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-cyan underline decoration-cyan/40 underline-offset-2 transition-colors hover:text-signal hover:decoration-signal/60">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="my-4 list-disc space-y-1.5 pl-6">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 list-decimal space-y-1.5 pl-6">{children}</ol>,
        li: ({ children }) => <li className="text-[15px] leading-relaxed text-ink-1 marker:text-signal/60">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-2 border-signal/50 pl-4 text-ink-2">{children}</blockquote>
        ),
        code: ({ children, className }) =>
          /language-/.test(className ?? '') ? (
            <code className={`font-mono text-[13px] leading-relaxed text-ink-1 ${className ?? ''}`}>{children}</code>
          ) : (
            <code className="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-[13px] text-amber">{children}</code>
          ),
        pre: ({ children }) => (
          <pre className="my-4 overflow-x-auto rounded-md border border-line bg-bg-1 p-4">{children}</pre>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-md border border-line">
            <table className="w-full border-collapse text-[13px]">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-line-strong bg-bg-2 px-3 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-ink-2">{children}</th>
        ),
        td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top text-ink-1">{children}</td>,
        img: ({ src, alt }) => (
          <img src={src} alt={alt ?? ''} loading="lazy" className="my-4 max-w-full rounded-md border border-line" />
        ),
        hr: () => <hr className="my-8 border-line" />,
        strong: ({ children }) => <strong className="font-bold text-ink-0">{children}</strong>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
