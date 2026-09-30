import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDuration, formatLong } from '@/lib/date'
import type { Exam, MasteryTopic } from '@/lib/types'
import { MasteryIndicator } from '../common/mastery-indicator'
import { ProgressRing } from '../common/progress-ring'

interface ExamProgressProps {
  exam: Exam
  progress: number
  daysLeft: number
  forecastDaysEarly: number
  mastery?: MasteryTopic[]
}

export function ExamProgress({ exam, progress, daysLeft, forecastDaysEarly, mastery }: ExamProgressProps) {
  const pct = Math.round(progress * 100)
  const weak = mastery?.filter((m) => m.needsReview) ?? []
  const strong = [...(mastery ?? [])]
    .filter((m) => !m.needsReview)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  return (
    <aside className="flex flex-col gap-8" aria-label="Progresso esame">
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing value={progress} size={84} stroke={6} label={`${pct}% del programma completato`}>
            <span className="tabular text-lg font-semibold">{pct}%</span>
          </ProgressRing>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">completato</p>
            <p className="tabular text-xs text-muted-foreground">
              {exam.slidesCompleted} / {exam.totalSlides} slide
            </p>
            <p className="tabular text-xs text-muted-foreground">
              {formatDuration(exam.minutesStudied)} studiate
            </p>
          </div>
        </div>
        {forecastDaysEarly > 0 && (
          <div className="flex gap-3 rounded-xl bg-success/8 p-3.5">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <p className="text-pretty text-[13px] leading-5">
              Se mantieni questo ritmo completerai il programma{' '}
              <span className="font-semibold">{forecastDaysEarly} giorni prima</span> dell&apos;esame.
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Esame il <span className="font-medium text-foreground">{formatLong(exam.date)}</span> · tra{' '}
          {daysLeft} giorni
        </p>
      </section>

      {mastery && mastery.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="mastery-title">
          <div className="flex items-center justify-between">
            <h2 id="mastery-title" className="text-sm font-semibold tracking-tight">
              Padronanza
            </h2>
            <Link
              href="/statistiche"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Dettagli
            </Link>
          </div>
          {[...weak, ...strong].map((t) => (
            <MasteryIndicator key={t.id} topic={t} compact />
          ))}
          {weak.length > 0 && (
            <p className="text-pretty text-xs leading-5 text-muted-foreground">
              Abbiamo aggiunto brevi ripassi di{' '}
              <span className="font-medium text-foreground">{weak.map((w) => w.name).join(', ')}</span> nei
              prossimi giorni.
            </p>
          )}
        </section>
      )}
    </aside>
  )
}
