import { AccountManager } from '../components/AccountManager'
import { formatMoney } from '../utils/dateRanges'
import type { AccountBalance } from '../utils/accountBalances'
import type { NewAccount } from '../types'

interface Props {
  balances: AccountBalance[]
  knownCurrencies: string[]
  onAdd: (account: NewAccount) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function Accounts({ balances, knownCurrencies, onAdd, onDelete }: Props) {
  const byCurrency = new Map<string, number>()
  for (const { account, balance } of balances) {
    byCurrency.set(account.currency, (byCurrency.get(account.currency) ?? 0) + balance)
  }

  return (
    <div className="space-y-4">
      {byCurrency.size > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[...byCurrency.entries()].map(([currency, total]) => (
            <div key={currency} className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-xs text-ink-faint">Total in {currency}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(total, currency)}</p>
            </div>
          ))}
        </div>
      )}
      <AccountManager balances={balances} knownCurrencies={knownCurrencies} onAdd={onAdd} onDelete={onDelete} />
    </div>
  )
}
