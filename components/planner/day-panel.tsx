'use client'

import Button from '@mui/material/Button'
import { BookOpen, CalendarOff, Check, Circle } from 'lucide-react'
import Link from 'next/link'
import { SessionStatusBadge } from '@/components/common/status-badge'
import { SessionReport } from '@/components/plan/session-report'
import { formatDuration, formatWeekdayLong } from '@/lib/date'
import { materialLabel, sessionPages } from '@/lib/planner-materials'
import { studyHref } from '@/lib/routes'
import type { Exam, ISODate, StudySession, StudyDocument } from '@/lib/types'

export function DayPanel({
  date,
  session,
  exam,
  today,
  documents,
}: {
  today: ISODate
  documents: StudyDocument[]
  date: ISODate
  session?: StudySession
  exam: Exam
}) {
  const isExam = date === exam.date
  const canReport =
    session &&
    date <= today &&
    session.slideFrom !== undefined &&
    ['planned', 'rescheduled', 'completed', 'partial', 'skipped'].includes(session.status)
  const docId = session?.materialId ?? (exam.documentIds.length === 1 ? exam.documentIds[0] : undefined)

  return (
    <aside
      aria-live="polite"
      className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card p-5 lg:self-start"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {date === today ? 'Oggi' : 'Giorno selezionato'}
        </p>
        <h2 className="text-lg font-semibold capitalize tracking-tight">{formatWeekdayLong(date)}</h2>
      </div>

      {isExam ? (
        <div className="flex flex-col gap-2">
          <SessionStatusBadge status="exam" className="self-start" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Giorno dell’esame di {exam.name}. In bocca al lupo.
          </p>
        </div>
      ) : !session ? (
        <p className="text-sm text-muted-foreground">Nessuna sessione prevista per questo giorno.</p>
      ) : session.status === 'unavailable' ? (
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <CalendarOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          Giorno segnato come non disponibile.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <SessionStatusBadge status={session.status} />
              <span className="tabular text-sm text-muted-foreground">
                {session.previousDurationMin && session.previousDurationMin !== session.durationMin && (
                  <span className="mr-1.5 line-through">{formatDuration(session.previousDurationMin)}</span>
                )}
                {formatDuration(session.durationMin)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {materialLabel(session, documents)}
              </p>
              {session.materialName && (
                <p className="break-words text-lg font-semibold leading-6">{session.materialName}</p>
              )}
              <p className="text-base font-semibold">{sessionPages(session)}</p>
              {session.slideFrom != null && (
                <p className="text-xs leading-5 text-muted-foreground">
                  Apri queste pagine nella dispensa indicata. La numerazione coincide con il PDF originale.
                </p>
              )}
              {session.topic && <p className="text-sm text-muted-foreground">{session.topic}</p>}
            </div>
            {session.note && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{session.note}</p>
            )}
          </div>

          {session.tasks.length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-border pt-4">
              {session.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5 text-sm">
                  {t.done ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="Fatto" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-border" aria-label="Da fare" />
                  )}
                  <span className={t.done ? 'text-muted-foreground line-through' : ''}>{t.label}</span>
                  <span className="tabular ml-auto shrink-0 text-xs text-muted-foreground">
                    {t.durationMin}m
                  </span>
                </li>
              ))}
            </ul>
          )}

          {docId && session.slideFrom !== undefined && date >= today && (
            <Button
              component={Link}
              href={studyHref(docId, session)}
              variant={date === today ? 'contained' : 'outlined'}
              color={date === today ? 'primary' : 'inherit'}
              startIcon={<BookOpen className="size-4" />}
            >
              {date === today ? 'Inizia la sessione' : 'Studia in anticipo'}
            </Button>
          )}

          {canReport && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">Com’è andata?</p>
              <SessionReport session={session} />
            </div>
          )}
        </>
      )}
    </aside>
  )
}
