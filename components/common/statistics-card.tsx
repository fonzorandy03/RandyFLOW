import { cn } from '@/lib/utils'

interface StatisticsCardProps {
  label: string
  value: string
  hint?: string
  delta?: { value: string; positive: boolean }
  className?: string
}

export function StatisticsCard({ label, value, hint, delta, className }: StatisticsCardProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 py-1', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="tabular text-2xl font-semibold tracking-tight md:text-[28px]">{value}</span>
      <div className="flex items-center gap-2 text-xs">
        {delta && (
          <span className={cn('font-medium', delta.positive ? 'text-success' : 'text-warning')}>
            {delta.value}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  )
}
