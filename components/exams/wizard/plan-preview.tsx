'use client'

import { TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { TODAY, addDays, formatDay, formatDuration, formatWeekdayShort } from '@/lib/date'
import { generatePlan } from '@/lib/planner-engine'
import { cn } from '@/lib/utils'
import type { ExamDraft } from '../new-exam-wizard'

export function PlanPreview({ draft }: { draft: ExamDraft }) {
  const pages = draft.documents.reduce((s, d) => s + d.pages, 0)

  const plan = useMemo(() => {
    const step = Math.ceil(pages / 5)
    const chapters = Array.from({ length: Math.ceil(pages / step) }, (_, i) => ({
      title: `Parte ${i + 1}`,
      from: i * step + 1,
      to: Math.min(pages, (i + 1) * step),
    }))
    return generatePlan({
      examId: 'preview',
      startDate: addDays(TODAY, 1),
      examDate: draft.date,
      startSlide: 1,
      endSlide: pages,
      availability: draft.availability,
      unavailable: draft.unavailableDays,
      reviewDays: draft.reviewDays,
      chapters,
      idPrefix: 'preview',
    })
  }, [draft, pages])

  const study = plan.filter((s) => s.slideFrom !== undefined)
  const covered = Math.max(0, ...study.map((s) => s.slideTo ?? 0))
  const totalMin = plan
    .filter((s) => s.status !== 'unavailable' && s.status !== 'exam')
    .reduce((s, x) => s + x.durationMin, 0)
  const lastStudy = study.at(-1)
  const preview = plan.filter((s) => s.status !== 'unavailable').slice(0, 7)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Ordine di studio scelto</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
          {draft.documents.map((document) => (
            <li key={document.id}>{document.name}</li>
          ))}
        </ol>
      </div>
      <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Sessioni</dt>
          <dd className="tabular text-xl font-semibold">{study.length}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Tempo totale</dt>
          <dd className="tabular text-xl font-semibold">{formatDuration(totalMin)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Fine materiale</dt>
          <dd className="tabular text-xl font-semibold">{lastStudy ? formatDay(lastStudy.date) : '—'}</dd>
        </div>
      </dl>

      {covered < pages && (
        <p role="alert" className="flex items-start gap-3 rounded-xl bg-warning/10 px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>
            Con questa disponibilità copri {covered} pagine su {pages}. Aumenta i minuti giornalieri o riduci
            i giorni di ripasso.
          </span>
        </p>
      )}

      <ol className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {preview.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-4 py-3">
            <span className="w-16 shrink-0 text-xs capitalize text-muted-foreground">
              {formatWeekdayShort(s.date)} {formatDay(s.date).split(' ')[0]}
            </span>
            <span
              className={cn(
                'flex-1 truncate text-sm font-medium',
                s.status === 'review' && 'text-muted-foreground',
              )}
            >
              {s.slideFrom !== undefined
                ? `Pagine ${s.slideFrom}–${s.slideTo}`
                : s.status === 'exam'
                  ? 'Esame'
                  : 'Ripasso'}
            </span>
            <span className="tabular text-sm text-muted-foreground">
              {s.status === 'exam' ? '' : formatDuration(s.durationMin)}
            </span>
          </li>
        ))}
      </ol>
      {plan.length > preview.length && (
        <p className="text-center text-xs text-muted-foreground">
          e altre {plan.filter((s) => s.status !== 'unavailable').length - preview.length} giornate fino
          all’esame
        </p>
      )}
    </div>
  )
}
