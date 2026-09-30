import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDayUpper, formatDuration, relativeDay } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { StudySession } from '@/lib/types'
import { SectionTitle } from '../common/page-header'
import { SESSION_STATUS } from '../common/status-badge'

export function UpcomingGoals({ sessions }: { sessions: StudySession[] }) {
  return (
    <section aria-labelledby="upcoming-title">
      <SectionTitle
        action={
          <Link
            href="/planner"
            className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Apri planner
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      >
        <span id="upcoming-title">Prossimi obiettivi</span>
      </SectionTitle>
      <ol className="flex flex-col divide-y divide-border">
        {sessions.map((s) => {
          const status = SESSION_STATUS[s.status]
          const [day, month] = formatDayUpper(s.date).split(' ')
          return (
            <li key={s.id} className="flex items-center gap-4 py-3.5 first:pt-0">
              <div className="flex w-10 shrink-0 flex-col items-center leading-none">
                <span className="tabular text-lg font-semibold">{day}</span>
                <span className="mt-1 text-[10px] font-medium tracking-wider text-muted-foreground">
                  {month}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.topic ?? status.label}</p>
                {s.materialName && <p className="truncate text-xs font-medium text-primary">{s.materialName}</p>}
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {relativeDay(s.date)}
                  {s.slideFrom !== undefined && ` · Slide ${s.slideFrom}–${s.slideTo}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                {s.status !== 'planned' && (
                  <span
                    className={cn(
                      'hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline',
                      status.chip,
                    )}
                  >
                    {status.label}
                  </span>
                )}
                <span className="tabular w-14 text-right text-sm text-muted-foreground">
                  {formatDuration(s.durationMin)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
