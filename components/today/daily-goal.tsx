'use client'

import Button from '@mui/material/Button'
import { ArrowRight, Clock, FileText, ListChecks } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/date'
import { studyHref } from '@/lib/routes'
import type { Exam, StudyDocument, StudySession } from '@/lib/types'
import { StudyTask } from './study-task'

interface DailyGoalProps {
  exam: Exam
  session: StudySession
  document: StudyDocument
  onToggleTask: (taskId: string) => void
}

export function DailyGoal({ exam, session, document, onToggleTask }: DailyGoalProps) {
  const total = (session.slideTo ?? 0) - (session.slideFrom ?? 0) + 1
  const done = session.slidesDone ?? 0
  const pct = total ? done / total : 0
  const readTask = session.tasks.find((t) => t.kind === 'read')
  const readMin = readTask?.durationMin ?? session.durationMin
  const complete = done >= total

  return (
    <section
      aria-labelledby="daily-goal-title"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,18,24,0.04)]"
    >
      <div className="flex flex-col gap-6 p-5 md:p-7">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{exam.name}</p>
          <p className="mt-3 text-xs text-muted-foreground">Obiettivo di oggi</p>
          <h2 id="daily-goal-title" className="text-balance text-xl font-semibold tracking-tight md:text-2xl">
            {session.topic}
          </h2>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Materiale</dt>
            <dd className="tabular font-medium">
              Slide {session.slideFrom}–{session.slideTo}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Tempo stimato</dt>
            <dd className="tabular font-medium">{formatDuration(readMin)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Task</dt>
            <dd className="tabular font-medium">
              {session.tasks.filter((t) => t.done).length} / {session.tasks.length}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="tabular font-medium">
              {done} <span className="text-muted-foreground">/ {total} slide</span>
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Slide completate oggi"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>

        <ul className="-mx-2 flex flex-col" aria-label="Task di oggi">
          {session.tasks.map((t) => (
            <StudyTask key={t.id} task={t} onToggle={() => onToggleTask(t.id)} />
          ))}
        </ul>

        {session.note && <p className="-mt-2 text-xs text-muted-foreground">{session.note}</p>}
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <p className="text-sm text-muted-foreground">
          {complete
            ? 'Obiettivo completato. Verifica quello che hai imparato.'
            : `Riprendi da slide ${(session.slideFrom ?? 1) + done} · ${document.name}`}
        </p>
        <Button
          component={Link}
          href={complete ? `/quiz?exam=${exam.id}` : studyHref(document.id, session)}
          variant="contained"
          size="large"
          endIcon={<ArrowRight className="size-4" />}
          className="h-12 shrink-0 px-6 text-[15px] font-semibold tracking-wide shadow-[0_6px_20px_-8px_var(--primary)]"
        >
          {complete ? 'Inizia quiz' : 'Inizia a studiare'}
        </Button>
      </div>
    </section>
  )
}
