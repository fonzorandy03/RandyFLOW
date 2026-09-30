import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { ProgressRing } from '@/components/common/progress-ring'
import { ExamStatusLabel } from '@/components/common/status-badge'
import { daysUntil, formatDay, formatDuration, relativeDay } from '@/lib/date'
import type { Exam, StudySession } from '@/lib/types'

export function ExamCard({ exam, next }: { exam: Exam; next?: StudySession }) {
  const pct = exam.totalSlides ? exam.slidesCompleted / exam.totalSlides : 0
  const days = daysUntil(exam.date)

  return (
    <Link
      href={`/esami/${encodeURIComponent(exam.id)}`}
      className="group flex h-full flex-col gap-6 rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_12px_32px_-18px_rgba(17,19,24,0.25)] md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <ExamStatusLabel status={exam.status} />
          <h2 className="text-pretty text-base font-semibold tracking-tight">{exam.name}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDay(exam.date)} · <span className="tabular">{days} giorni</span>
          </p>
        </div>
        <ProgressRing value={pct} size={56} label={`${Math.round(pct * 100)}% completato`}>
          <span className="tabular text-xs font-semibold">{Math.round(pct * 100)}%</span>
        </ProgressRing>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Slide</dt>
          <dd className="tabular font-medium">
            {exam.slidesCompleted}/{exam.totalSlides}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Studiate</dt>
          <dd className="tabular font-medium">{formatDuration(exam.minutesStudied)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Ripasso</dt>
          <dd className="tabular font-medium">{exam.reviewDays} giorni</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">Prossima sessione</span>
          <span className="truncate text-sm font-medium">
            {next
              ? `${relativeDay(next.date)} · ${next.materialName ? `${next.materialName} · ` : ''}${
                  next.slideFrom !== undefined
                    ? `slide ${next.slideFrom}–${next.slideTo}`
                    : (next.topic ?? 'Ripasso')
                }`
              : 'Nessuna in programma'}
          </span>
        </div>
        <ArrowUpRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
    </Link>
  )
}
