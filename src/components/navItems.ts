import {
  LayoutDashboard,
  Receipt,
  ChartNoAxesCombined,
  Target,
  WalletCards,
  Users,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type Tab =
  | 'overview'
  | 'transactions'
  | 'analytics'
  | 'add'
  | 'budgets'
  | 'accounts'
  | 'people'
  | 'loans'
  | 'settings'

export type NavSection = 'overview' | 'money'

export interface NavItem {
  id: Tab
  label: string
  icon: LucideIcon
  section: NavSection
  /** Shown directly in the mobile bottom bar (rather than inside "More"). */
  mobilePrimary: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'overview', mobilePrimary: true },
  { id: 'transactions', label: 'Transactions', icon: Receipt, section: 'overview', mobilePrimary: true },
  { id: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined, section: 'overview', mobilePrimary: true },
  { id: 'budgets', label: 'Budgets', icon: Target, section: 'money', mobilePrimary: false },
  { id: 'accounts', label: 'Accounts', icon: WalletCards, section: 'money', mobilePrimary: false },
  { id: 'people', label: 'People & Debts', icon: Users, section: 'money', mobilePrimary: false },
  { id: 'loans', label: 'Loans & Credit', icon: CreditCard, section: 'money', mobilePrimary: false },
]

export const SETTINGS_ITEM: NavItem = {
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  section: 'money',
  mobilePrimary: false,
}

export const SECTION_LABELS: Record<NavSection, string> = {
  overview: 'Overview',
  money: 'Money',
}

/** Items surfaced in the mobile "More" sheet — everything not pinned to the bottom bar. */
export const MORE_ITEMS: NavItem[] = [...NAV_ITEMS.filter((i) => !i.mobilePrimary), SETTINGS_ITEM]
