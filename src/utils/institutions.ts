import type { AccountType } from '../types'

export type InstitutionCategory = 'bank' | 'digitalBank' | 'card' | 'ewallet' | 'bnpl'

export interface Institution {
  id: string
  name: string
  shortCode: string
  category: InstitutionCategory
  color: string
}

export const INSTITUTION_CATEGORY_LABELS: Record<InstitutionCategory, string> = {
  bank: 'Banks',
  digitalBank: 'Digital banks',
  card: 'Card networks',
  ewallet: 'E-wallets',
  bnpl: 'Buy now, pay later',
}

/**
 * Curated directory of Malaysian financial institutions. We don't have
 * rights to embed the real trademarked logo artwork, so each entry renders
 * as a brand-colored monogram badge (see InstitutionBadge) instead of an
 * actual logo image.
 */
export const MALAYSIA_INSTITUTIONS: Institution[] = [
  // Banks
  { id: 'maybank', name: 'Maybank', shortCode: 'MBB', category: 'bank', color: '#ffc72c' },
  { id: 'cimb', name: 'CIMB Bank', shortCode: 'CIMB', category: 'bank', color: '#7a1f2b' },
  { id: 'publicbank', name: 'Public Bank', shortCode: 'PBB', category: 'bank', color: '#c8102e' },
  { id: 'rhb', name: 'RHB Bank', shortCode: 'RHB', category: 'bank', color: '#0033a0' },
  { id: 'hongleong', name: 'Hong Leong Bank', shortCode: 'HLB', category: 'bank', color: '#003da5' },
  { id: 'ambank', name: 'AmBank', shortCode: 'AMB', category: 'bank', color: '#8dc63f' },
  { id: 'bankislam', name: 'Bank Islam', shortCode: 'BIMB', category: 'bank', color: '#00a651' },
  { id: 'bsn', name: 'BSN', shortCode: 'BSN', category: 'bank', color: '#f7941e' },
  { id: 'uob', name: 'UOB Malaysia', shortCode: 'UOB', category: 'bank', color: '#003da5' },
  { id: 'ocbc', name: 'OCBC Bank', shortCode: 'OCBC', category: 'bank', color: '#e4002b' },
  { id: 'hsbc', name: 'HSBC Malaysia', shortCode: 'HSBC', category: 'bank', color: '#db0011' },
  { id: 'alliance', name: 'Alliance Bank', shortCode: 'ALB', category: 'bank', color: '#003057' },
  { id: 'affin', name: 'Affin Bank', shortCode: 'AFB', category: 'bank', color: '#00539f' },
  { id: 'bankrakyat', name: 'Bank Rakyat', shortCode: 'BKRM', category: 'bank', color: '#00923f' },
  { id: 'sc', name: 'Standard Chartered', shortCode: 'SCB', category: 'bank', color: '#0473ea' },
  { id: 'muamalat', name: 'Bank Muamalat', shortCode: 'BMMB', category: 'bank', color: '#8b1e3f' },
  { id: 'alrajhi', name: 'Al Rajhi Bank', shortCode: 'ARB', category: 'bank', color: '#00693e' },
  { id: 'agrobank', name: 'Agrobank', shortCode: 'AGB', category: 'bank', color: '#4c9f38' },
  { id: 'kuwaitfinance', name: 'Kuwait Finance House', shortCode: 'KFH', category: 'bank', color: '#00693e' },

  // Digital banks (Bank Negara Malaysia digital banking licensees)
  { id: 'gxbank', name: 'GXBank', shortCode: 'GX', category: 'digitalBank', color: '#00c853' },
  { id: 'boostbank', name: 'Boost Bank', shortCode: 'BB', category: 'digitalBank', color: '#d32f3d' },
  { id: 'aeonbank', name: 'AEON Bank', shortCode: 'AEON', category: 'digitalBank', color: '#d6006d' },
  { id: 'rytbank', name: 'Ryt Bank', shortCode: 'RYT', category: 'digitalBank', color: '#7b2ff7' },
  { id: 'kafdigital', name: 'KAF Digital Bank', shortCode: 'KAF', category: 'digitalBank', color: '#003049' },

  // Card networks
  { id: 'visa', name: 'Visa', shortCode: 'VISA', category: 'card', color: '#1a1f71' },
  { id: 'mastercard', name: 'Mastercard', shortCode: 'MC', category: 'card', color: '#eb001b' },
  { id: 'amex', name: 'American Express', shortCode: 'AMEX', category: 'card', color: '#2e77bc' },
  { id: 'unionpay', name: 'UnionPay', shortCode: 'UP', category: 'card', color: '#e21836' },
  { id: 'mydebit', name: 'MyDebit', shortCode: 'MYD', category: 'card', color: '#c8102e' },

  // E-wallets
  { id: 'tng', name: "Touch 'n Go eWallet", shortCode: 'TNG', category: 'ewallet', color: '#0072ce' },
  { id: 'grabpay', name: 'GrabPay', shortCode: 'GRAB', category: 'ewallet', color: '#00b14f' },
  { id: 'boost', name: 'Boost', shortCode: 'BOOST', category: 'ewallet', color: '#ee2737' },
  { id: 'shopeepay', name: 'ShopeePay', shortCode: 'SHOP', category: 'ewallet', color: '#ee4d2d' },
  { id: 'bigpay', name: 'BigPay', shortCode: 'BIG', category: 'ewallet', color: '#d71249' },
  { id: 'mae', name: 'MAE by Maybank', shortCode: 'MAE', category: 'ewallet', color: '#ffc72c' },
  { id: 'setel', name: 'Setel', shortCode: 'SETEL', category: 'ewallet', color: '#00a19c' },
  { id: 'wechatpay', name: 'WeChat Pay MY', shortCode: 'WCP', category: 'ewallet', color: '#09b83e' },
  { id: 'fave', name: 'Fave', shortCode: 'FAVE', category: 'ewallet', color: '#ff4e45' },
  { id: 'razerpay', name: 'MerchantTrade / RazerPay', shortCode: 'RZP', category: 'ewallet', color: '#1a9c2e' },

  // Buy now, pay later
  { id: 'atome', name: 'Atome', shortCode: 'ATOME', category: 'bnpl', color: '#6c4cff' },
  { id: 'grabpaylater', name: 'Grab PayLater', shortCode: 'GRAB', category: 'bnpl', color: '#00b14f' },
  { id: 'spaylater', name: 'SPayLater (Shopee)', shortCode: 'SPL', category: 'bnpl', color: '#ee4d2d' },
  { id: 'split', name: 'Split', shortCode: 'SPLIT', category: 'bnpl', color: '#00c2a8' },
  { id: 'pace', name: 'Pace', shortCode: 'PACE', category: 'bnpl', color: '#ff6b4a' },
  { id: 'rely', name: 'Rely', shortCode: 'RELY', category: 'bnpl', color: '#2f6fed' },
  { id: 'favepaylater', name: 'FavePay Later', shortCode: 'FAVE', category: 'bnpl', color: '#ff4e45' },
]

export function findInstitution(id: string | undefined | null): Institution | undefined {
  return id ? MALAYSIA_INSTITUTIONS.find((i) => i.id === id) : undefined
}

export function institutionsByCategory(category: InstitutionCategory): Institution[] {
  return MALAYSIA_INSTITUTIONS.filter((i) => i.category === category)
}

/** Which institution categories make sense to offer for a given account type. */
export function categoriesForAccountType(type: AccountType): InstitutionCategory[] {
  switch (type) {
    case 'bank':
      return ['bank', 'digitalBank']
    case 'credit':
      return ['card']
    case 'ewallet':
      return ['ewallet']
    case 'bnpl':
      return ['bnpl']
    case 'loan':
      return ['bank', 'digitalBank']
    case 'cash':
      return []
    case 'other':
      return ['bank', 'digitalBank', 'card', 'ewallet', 'bnpl']
  }
}
