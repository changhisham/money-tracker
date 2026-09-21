import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AccentChoice = 'sky' | 'indigo' | 'amber' | 'emerald' | 'rose'

export const ACCENT_OPTIONS: { id: AccentChoice; label: string; swatch: string }[] = [
  { id: 'sky', label: 'Sky', swatch: '#0284c7' },
  { id: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { id: 'amber', label: 'Amber', swatch: '#d97706' },
  { id: 'emerald', label: 'Emerald', swatch: '#059669' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
]

interface AccentContextValue {
  accent: AccentChoice
  setAccent: (accent: AccentChoice) => void
}

const STORAGE_KEY = 'money-tracker-accent'
const AccentContext = createContext<AccentContextValue | null>(null)

function isAccentChoice(value: string | null): value is AccentChoice {
  return ACCENT_OPTIONS.some((o) => o.id === value)
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentChoice>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return isAccentChoice(stored) ? stored : 'sky'
    } catch {
      return 'sky'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])

  function setAccent(next: AccentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
    setAccentState(next)
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}

export function useAccent() {
  const ctx = useContext(AccentContext)
  if (!ctx) throw new Error('useAccent must be used within AccentProvider')
  return ctx
}
