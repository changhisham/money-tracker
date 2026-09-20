import type { Account, Transaction } from '../types'

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function transactionsToCsv(transactions: Transaction[], accounts: Account[]): string {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id
  const header = ['Date', 'Type', 'Account', 'To account', 'Category', 'Payee', 'Amount', 'Currency', 'Tags', 'Excluded', 'Note']
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    accountName(t.accountId),
    t.toAccountId ? accountName(t.toAccountId) : '',
    t.category ?? '',
    t.payee ?? '',
    t.amount.toFixed(2),
    t.currency,
    (t.tags ?? []).join('; '),
    t.excluded ? 'Yes' : '',
    t.note,
  ])
  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvField(String(cell))).join(','))
    .join('\n')
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
