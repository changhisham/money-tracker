import { Banknote, ArrowLeftRight, Wallet } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import type { TransactionType } from '../types'

interface Props {
  onClose: () => void
  onChoose: (type: TransactionType) => void
}

const OPTIONS: { type: TransactionType; label: string; description: string; icon: typeof Banknote }[] = [
  { type: 'expense', label: 'Expense', description: 'Record something you spent', icon: Wallet },
  { type: 'income', label: 'Income', description: 'Record money you received', icon: Banknote },
  { type: 'transfer', label: 'Transfer', description: 'Move money between accounts', icon: ArrowLeftRight },
]

export function AddChooser({ onClose, onChoose }: Props) {
  return (
    <BottomSheet title="What would you like to add?" onClose={onClose}>
      <div className="space-y-2">
        {OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onChoose(type)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-base px-4 py-3.5 text-left transition hover:border-emerald-500 hover:bg-surface-hover"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs text-ink-faint">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
