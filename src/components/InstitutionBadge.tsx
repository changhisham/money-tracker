import type { Institution } from '../utils/institutions'

const SIZES = {
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-9 w-9 text-[11px]',
  lg: 'h-12 w-12 text-sm',
} as const

interface Props {
  institution: Institution
  size?: keyof typeof SIZES
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 165
}

export function InstitutionBadge({ institution, size = 'md' }: Props) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold tracking-tight ${SIZES[size]}`}
      style={{
        backgroundColor: institution.color,
        color: isLight(institution.color) ? '#0f172a' : '#ffffff',
      }}
      title={institution.name}
      aria-hidden
    >
      {institution.shortCode.slice(0, 4)}
    </span>
  )
}
