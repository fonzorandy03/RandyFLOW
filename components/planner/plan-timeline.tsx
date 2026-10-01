import Link from 'next/link'
import { studyHref } from '@/lib/routes'
import { sessionPages } from '@/lib/planner-materials'
import { SESSION_STATUS, SessionStatusBadge } from '@/components/common/status-badge'
import { addDays, formatDay, formatDuration, formatWeekdayShort, parseISO } from '@/lib/date'
import type { StudySession, ISODate } from '@/lib/types'
import { cn } from '@/lib/utils'

function weekStart(date: string) {
  const offset = (parseISO(date).getUTCDay() + 6) % 7
  return addDays(date, -offset)
}

export function PlanTimeline({ sessions, today }: { today: ISODate; sessions: StudySession[] }) {
  const weeks = new Map<string, StudySession[]>()
  for (const s of sessions) {
    const k = weekStart(s.date)
    weeks.set(k, [...(weeks.get(k) ?? []), s])
  }

  return (
    <div className="flex flex-col gap-8">
      {[...weeks].map(([start, list]) => {
        const minutes = list.filter((s) => s.status !== 'exam').reduce((sum, s) => sum + s.durationMin, 0)
        const current = today >= start && today <= addDays(start, 6)
        return (
          <section
            key={start}
            aria-label={`Settimana dal ${formatDay(start)}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-baseline justify-between">
              <h3 className={cn('text-sm font-semibold', current && 'text-primary')}>
                {current ? 'Questa settimana' : `${formatDay(start)} – ${formatDay(addDays(start, 6))}`}
              </h3>
              <span className="tabular text-xs text-muted-foreground">{formatDuration(minutes)}</span>
            </div>
            <ol className="relative flex flex-col gap-1 border-l border-border pl-5">
              {list.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    'relative flex items-center gap-4 rounded-xl px-3 py-2.5',
                    s.date === today && 'bg-primary/6',
                    s.status === 'unavailable' && 'opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'absolute -left-[25px] size-2.5 rounded-full ring-4 ring-background',
                      SESSION_STATUS[s.status].dot,
                    )}
                    aria-hidden
                  />
                  <span className="w-16 shrink-0 text-xs capitalize text-muted-foreground">
                    {formatWeekdayShort(s.date)} {parseISO(s.date).getUTCDate()}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {s.status === 'exam'
                        ? 'Esame'
                        : s.slideFrom !== undefined
                          ? sessionPages(s)
                          : s.status === 'unavailable'
                            ? 'Non disponibile'
                            : (s.topic ?? 'Ripasso')}
                    </span>
                    {s.materialName && s.slideFrom !== undefined && (
                      <Link
                        className="truncate text-sm font-semibold text-primary hover:underline"
                        href={s.materialId ? studyHref(s.materialId, s) : '/studio'}
                      >
                        {s.materialName} →
                      </Link>
                    )}
                    {s.topic && s.slideFrom !== undefined && (
                      <span className="truncate text-xs text-muted-foreground">{s.topic}</span>
                    )}
                  </div>
                  {s.status !== 'unavailable' && s.status !== 'exam' && (
                    <span className="tabular hidden text-sm text-muted-foreground sm:block">
                      {formatDuration(s.durationMin)}
                    </span>
                  )}
                  <SessionStatusBadge status={s.status} className="hidden md:inline-flex" />
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
