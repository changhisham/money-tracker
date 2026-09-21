import { format } from 'date-fns'
import { formatMoney } from '../utils/dateRanges'
import { liabilityBalances, loanDetail, totalBorrowedByCurrency, totalOutstandingByCurrency } from '../utils/loans'
import { findInstitution } from '../utils/institutions'
import { InstitutionBadge } from '../components/InstitutionBadge'
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../types'
import type { Account } from '../types'
import type { AccountBalance } from '../utils/accountBalances'

interface Props {
  accounts: Account[]
  balances: AccountBalance[]
}

export function Loans({ accounts, balances }: Props) {
  const liabilities = liabilityBalances(balances)
  const borrowed = totalBorrowedByCurrency(accounts)
  const outstanding = totalOutstandingByCurrency(balances)

  if (liabilities.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
        No loans or credit cards yet. Add one from the Accounts screen — choose "Loan", "Credit card" or "BNPL
        (PayLater)" as the type — to track it here.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {(outstanding.length > 0 || borrowed.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {outstanding.map((t) => (
            <div key={`out-${t.currency}`} className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-xs text-ink-faint">Total outstanding ({t.currency})</p>
              <p className="mt-1 text-2xl font-semibold text-red-400">{formatMoney(t.total, t.currency)}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">Loans, credit cards & PayLater combined</p>
            </div>
          ))}
          {borrowed.map((t) => (
            <div key={`borrow-${t.currency}`} className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-xs text-ink-faint">Total borrowed ({t.currency})</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(t.total, t.currency)}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">Sum of original principal across loans</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {liabilities.map((lb) => {
          const detail = loanDetail(lb)
          const inst = findInstitution(lb.account.institutionId)
          return (
            <div key={lb.account.id} className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                {inst ? (
                  <InstitutionBadge institution={inst} />
                ) : (
                  <span className="text-lg" aria-hidden>
                    {ACCOUNT_TYPE_ICONS[lb.account.type]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{lb.account.name}</p>
                  <p className="text-xs text-ink-faint">{ACCOUNT_TYPE_LABELS[lb.account.type]}</p>
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold text-red-400">
                {formatMoney(detail.outstanding, lb.account.currency)}
              </p>
              <p className="text-xs text-ink-faint">owed</p>

              {detail.progressPct !== null && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-income transition-all"
                      style={{ width: `${detail.progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {detail.progressPct.toFixed(0)}% paid off ·{' '}
                    {formatMoney(lb.account.originalPrincipal!, lb.account.currency)} original
                  </p>
                </div>
              )}

              {(lb.account.interestRate || lb.account.monthlyPayment || detail.estimatedPayoffDate) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-ink-faint">
                  {lb.account.interestRate != null && <span>{lb.account.interestRate}% interest</span>}
                  {lb.account.monthlyPayment != null && (
                    <span>{formatMoney(lb.account.monthlyPayment, lb.account.currency)}/mo</span>
                  )}
                  {detail.estimatedPayoffDate && <span>Est. payoff {format(detail.estimatedPayoffDate, 'MMM yyyy')}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
