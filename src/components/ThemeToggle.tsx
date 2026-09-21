import { useTheme, type ThemeChoice } from '../context/ThemeContext'

const OPTIONS: { id: ThemeChoice; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'system', label: 'Auto', icon: '🖥️' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex rounded-xl bg-base p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setTheme(opt.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
            theme === opt.id ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <span aria-hidden>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
