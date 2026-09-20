import { useState, type KeyboardEvent } from 'react'

interface Props {
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-emerald-500">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-medium text-ink-soft"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="text-ink-faint hover:text-red-400"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        aria-label="Add tag"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? 'e.g. business, reimbursable' : ''}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm text-ink placeholder-ink-faint outline-none"
      />
    </div>
  )
}
