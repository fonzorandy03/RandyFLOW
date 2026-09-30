import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  children?: React.ReactNode
  label?: string
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 4,
  className,
  trackClassName,
  indicatorClassName,
  children,
  label,
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={cn('stroke-border', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className={cn(
            'stroke-primary transition-[stroke-dashoffset] duration-700 ease-out',
            indicatorClassName,
          )}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
