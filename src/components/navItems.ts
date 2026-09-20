export type Tab = 'dashboard' | 'add' | 'accounts' | 'loans' | 'budgets' | 'people' | 'settings'

export interface NavItem {
  id: Tab
  label: string
  icon: string
  mobile: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', mobile: true },
  { id: 'add', label: 'Record', icon: '🧾', mobile: true },
  { id: 'accounts', label: 'Accounts', icon: '🏦', mobile: false },
  { id: 'loans', label: 'Loans', icon: '📉', mobile: false },
  { id: 'budgets', label: 'Budgets', icon: '🎯', mobile: true },
  { id: 'people', label: 'People', icon: '👥', mobile: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', mobile: true },
]
