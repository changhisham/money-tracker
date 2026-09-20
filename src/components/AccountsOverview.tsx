import { formatMoney } from '../utils/dateRanges'
import { ACCOUNT_TYPE_ICONS } from '../types'
import { findInstitution } from '../utils/institutions'
import { InstitutionBadge } from './InstitutionBadge'
import type { AccountBalance } from '../utils/accountBalances'

interface Props {
  balances: AccountBalance[]
}

export function AccountsOverview({ balances }: Props) {
  if (balances.length === 0) return null

  return (
    <div className="animate-fade-in -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
      {balances.map(({ account, balance }) => {
        const inst = findInstitution(account.institutionId)
        return (
          <div
            key={account.id}
            className="flex min-w-38 shrink-0 flex-col gap-1 rounded-2xl border border-line bg-surface p-3 lg:min-w-0"
          >
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              {inst ? (
                <InstitutionBadge institution={inst} size="sm" />
              ) : (
                <span aria-hidden>{ACCOUNT_TYPE_ICONS[account.type]}</span>
              )}
              <span className="truncate">{account.name}</span>
            </span>
            <span className={`text-base font-semibold ${balance < 0 ? 'text-red-400' : 'text-ink'}`}>
              {formatMoney(balance, account.currency)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
