'use client'

import IconButton from '@mui/material/IconButton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { SESSION_STATUS } from '@/components/common/status-badge'
import { TODAY, formatDuration, formatWeekdayLong, monthLabel, parseISO, toISO } from '@/lib/date'
import type { ISODate, StudySession } from '@/lib/types'
import { cn } from '@/lib/utils'

const HEAD = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function monthGrid(year: number, month: number): (ISODate | null)[] {
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (ISODate | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= days; d++) cells.push(toISO(new Date(Date.UTC(year, month, d))))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function MonthCalendar({
  sessions,
  examDate,
  selected,
  onSelect,
}: {
  sessions: StudySession[]
  examDate: ISODate
  selected: ISODate
  onSelect: (d: ISODate) => void
}) {
  const start = parseISO(selected)
  const [cursor, setCursor] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() })
  const byDate = new Map(sessions.map((s) => [s.date, s]))
  const cells = monthGrid(cursor.y, cursor.m)

  const shift = (delta: number) =>
    setCursor(({ y, m }) => {
      const n = m + delta
      return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }
    })

  return (
    <section aria-label="Calendario" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{monthLabel(cursor.y, cursor.m)}</h2>
        <div className="flex gap-1">
          <IconButton size="small" onClick={() => shift(-1)} aria-label="Mese precedente">
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton size="small" onClick={() => shift(1)} aria-label="Mese successivo">
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {HEAD.map((h) => (
            <div key={h} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date)
              return (
                <div
                  key={`e-${i}`}
                  className="min-h-16 border-b border-r border-border bg-muted/30 md:min-h-24"
                />
              )
            const s = byDate.get(date)
            const isExam = date === examDate
            const status = isExam ? 'exam' : s?.status
            const isSel = date === selected
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                aria-pressed={isSel}
                aria-label={`${formatWeekdayLong(date)}${status ? `, ${SESSION_STATUS[status].label}` : ''}`}
                className={cn(
                  'group relative flex min-h-16 flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition-colors md:min-h-24 md:p-2',
                  '[&:nth-child(7n)]:border-r-0',
                  isSel ? 'bg-primary/6' : 'hover:bg-muted/60',
                  status === 'unavailable' && 'bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'tabular flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    date === TODAY && 'bg-primary text-primary-foreground',
                    isExam && date !== TODAY && 'bg-foreground text-background',
                    date < TODAY && date !== TODAY && !isExam && 'text-muted-foreground',
                  )}
                >
                  {parseISO(date).getUTCDate()}
                </span>
                {status && status !== 'unavailable' && (
                  <>
                    <span
                      className={cn('size-1.5 rounded-full md:hidden', SESSION_STATUS[status].dot)}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'hidden w-full truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium md:block',
                        SESSION_STATUS[status].chip,
                      )}
                    >
                      {isExam
                        ? 'Esame'
                        : s?.slideFrom !== undefined
                          ? `${s.slideFrom}–${s.slideTo}`
                          : status === 'review'
                            ? 'Ripasso'
                            : SESSION_STATUS[status].label}
                    </span>
                    {s && !isExam && (
                      <span className="tabular hidden text-[11px] text-muted-foreground md:block">
                        {formatDuration(s.durationMin)}
                      </span>
                    )}
                  </>
                )}
                {isSel && (
                  <span
                    className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-primary"
                    aria-hidden
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
