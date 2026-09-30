'use client'

import { Minus, Plus } from 'lucide-react'
import { WEEKDAY_LABELS, WEEKDAY_ORDER, formatDuration } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Availability, Weekday } from '@/lib/types'

const STEP = 15
const MAX = 300

export function AvailabilityEditor({
  value,
  onChange,
}: {
  value: Availability
  onChange: (v: Availability) => void
}) {
  const set = (day: Weekday, minutes: number) =>
    onChange({ ...value, [day]: Math.max(0, Math.min(MAX, minutes)) })

  return (
    <ul className="flex flex-col divide-y divide-border">
      {WEEKDAY_ORDER.map((day) => {
        const min = value[day]
        return (
          <li key={day} className="flex items-center gap-4 py-2.5">
            <span className={cn('w-24 text-sm font-medium', min === 0 && 'text-muted-foreground')}>
              {WEEKDAY_LABELS[day]}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(min / MAX) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => set(day, min - STEP)}
                disabled={min === 0}
                aria-label={`Riduci ${WEEKDAY_LABELS[day]}`}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="tabular w-16 text-center text-sm font-medium" aria-live="polite">
                {min === 0 ? 'Libero' : formatDuration(min)}
              </span>
              <button
                type="button"
                onClick={() => set(day, min + STEP)}
                disabled={min >= MAX}
                aria-label={`Aumenta ${WEEKDAY_LABELS[day]}`}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
