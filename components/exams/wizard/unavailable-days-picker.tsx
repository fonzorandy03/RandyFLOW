'use client'

import { TODAY, addDays, dateRange, formatWeekdayShort, parseISO } from '@/lib/date'
import type { ISODate } from '@/lib/types'
import { cn } from '@/lib/utils'

export function UnavailableDaysPicker({
  examDate,
  value,
  onChange,
}: {
  examDate: ISODate
  value: ISODate[]
  onChange: (v: ISODate[]) => void
}) {
  const days = dateRange(addDays(TODAY, 1), addDays(examDate, -1)).slice(0, 56)
  const toggle = (d: ISODate) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort())

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 flex w-full items-baseline justify-between text-sm font-medium">
        Giorni non disponibili
        <span className="text-xs font-normal text-muted-foreground">
          {value.length ? `${value.length} selezionati` : 'Nessuno'}
        </span>
      </legend>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const on = value.includes(d)
          const date = parseISO(d)
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              aria-pressed={on}
              aria-label={`${formatWeekdayShort(d)} ${date.getDate()}`}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-lg border text-xs transition-colors',
                on
                  ? 'border-foreground/20 bg-muted text-muted-foreground line-through'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <span className="text-[10px] uppercase text-muted-foreground">
                {formatWeekdayShort(d).slice(0, 2)}
              </span>
              <span className="tabular font-medium">{date.getDate()}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
