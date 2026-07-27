import { SCENES } from '@/lib/api'

interface Props {
  value: string
  onChange: (scene: string) => void
}

/** 场景快捷 chips —— 对应后端 9 场景 + 默认集 */
export default function SceneChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SCENES.map((s) => {
        const active = s.id === value
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`rounded-full border px-3 py-1 font-mono text-[12px] transition-colors ${
              active
                ? 'border-signal bg-signal/10 text-signal'
                : 'border-line bg-bg-1 text-ink-2 hover:border-line-strong hover:text-ink-1'
            }`}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
