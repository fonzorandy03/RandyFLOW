'use client'

import IconButton from '@mui/material/IconButton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { SESSION_STATUS } from '@/components/common/status-badge'
import { formatDuration, formatWeekdayLong, monthLabel, parseISO, toISO } from '@/lib/date'
import type { ISODate, StudySession, StudyDocument } from '@/lib/types'
import { materialLabel, materialTone, sessionPages } from '@/lib/planner-materials'
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
  today,
  documents,
  examDate,
  selected,
  onSelect,
}: {
  today: ISODate
  documents: StudyDocument[]
  sessions: StudySession[]
  examDate: ISODate
  selected: ISODate
  onSelect: (d: ISODate) => void
}) {
  const start = parseISO(selected)
  const [cursor, setCursor] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() })
  const byDate = new Map<ISODate, StudySession[]>()
  for (const session of sessions) byDate.set(session.date, [...(byDate.get(session.date) ?? []), session])
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
                  className="min-h-24 border-b border-r border-border bg-muted/30 md:min-h-32"
                />
              )
            const daySessions = byDate.get(date) ?? []
            const s = daySessions[0]
            const isExam = date === examDate
            const status = isExam ? 'exam' : s?.status
            const isSel = date === selected
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                aria-pressed={isSel}
                aria-label={`${formatWeekdayLong(date)}${isExam ? ', Esame' : ''}${daySessions.map((item) => `, ${item.materialName ?? materialLabel(item, documents)}, ${sessionPages(item)}`).join('')}`}
                title={daySessions
                  .map(
                    (item) =>
                      `${item.materialName ?? materialLabel(item, documents)} · ${sessionPages(item)}`,
                  )
                  .join('\n')}
                className={cn(
                  'group relative flex min-h-24 flex-col items-start gap-1 border-b border-r border-border p-1 text-left transition-colors md:min-h-32 md:p-2.5',
                  '[&:nth-child(7n)]:border-r-0',
                  isSel ? 'bg-primary/6' : 'hover:bg-muted/60',
                  status === 'unavailable' && 'bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'tabular flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    date === today && 'bg-primary text-primary-foreground',
                    isExam && date !== today && 'bg-foreground text-background',
                    date < today && date !== today && !isExam && 'text-muted-foreground',
                  )}
                >
                  {parseISO(date).getUTCDate()}
                </span>
                {isExam ? (
                  <span className="w-full rounded-lg bg-foreground px-1.5 py-1 text-[10px] font-semibold text-background">
                    Esame
                  </span>
                ) : (
                  daySessions.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className={`flex w-full flex-col gap-0.5 rounded-lg border px-1 py-1 text-[9px] leading-4 md:px-1.5 md:text-[11px] ${materialTone(
                        Math.max(
                          0,
                          documents.findIndex((doc) => doc.id === item.materialId),
                        ),
                      )}`}
                    >
                      <span className="truncate font-semibold">
                        {item.slideFrom != null ? (
                          <>
                            <span className="sm:hidden">
                              {materialLabel(item, documents).replace('Dispensa ', 'D')}
                            </span>
                            <span className="hidden sm:inline">{materialLabel(item, documents)}</span>
                          </>
                        ) : (
                          SESSION_STATUS[item.status].label
                        )}
                      </span>
                      {item.slideFrom != null && (
                        <span className="font-medium tabular-nums">
                          <span className="hidden sm:inline">PDF </span>
                          {item.slideFrom}
                          {item.slideTo !== item.slideFrom ? `–${item.slideTo}` : ''}
                        </span>
                      )}
                      <span className="hidden truncate text-[10px] opacity-75 lg:block">
                        {item.materialName}
                      </span>
                    </span>
                  ))
                )}
                {daySessions.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{daySessions.length - 2} sessioni
                  </span>
                )}
                {s && !isExam && (
                  <span className="mt-auto text-[10px] text-muted-foreground">
                    {formatDuration(daySessions.reduce((sum, item) => sum + item.durationMin, 0))}
                  </span>
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
