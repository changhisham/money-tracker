import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface Props {
  label: string
  value: string
  icon: string
  iconBg: string
  trendPct: number | null
  goodDirection: 'up' | 'down'
  sparkline: number[]
}

export function StatCard({ label, value, icon, iconBg, trendPct, goodDirection, sparkline }: Props) {
  const trendUp = (trendPct ?? 0) >= 0
  const isGood = trendPct === null ? null : trendUp === (goodDirection === 'up')
  const data = sparkline.map((v, i) => ({ i, v }))

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
          style={{ backgroundColor: iconBg }}
          aria-hidden
        >
          {icon}
        </span>
        {trendPct !== null && (
          <span className={`text-xs font-medium ${isGood ? 'text-income' : 'text-red-400'}`}>
            {trendUp ? '↗' : '↘'} {Math.abs(trendPct).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{label}</p>
      <p className="truncate text-lg font-semibold text-ink" title={value}>
        {value}
      </p>
      {data.some((d) => d.v > 0) && (
        <div className="mt-1 h-6 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#10b981"
                strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
