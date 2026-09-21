import { ACCENT_OPTIONS, useAccent } from '../context/AccentContext'

export function AccentPicker() {
  const { accent, setAccent } = useAccent()

  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setAccent(opt.id)}
          aria-label={opt.label}
          aria-pressed={accent === opt.id}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            accent === opt.id
              ? 'border-primary bg-primary/10 text-ink'
              : 'border-line text-ink-soft hover:bg-surface-hover'
          }`}
        >
          <span
            className="h-4 w-4 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: opt.swatch }}
            aria-hidden
          />
          {opt.label}
        </button>
      ))}
    </div>
  )
}
