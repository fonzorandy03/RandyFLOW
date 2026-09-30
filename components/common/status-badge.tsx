import { cn } from '@/lib/utils'
import type { ExamStatus, SessionStatus } from '@/lib/types'

export const SESSION_STATUS: Record<SessionStatus, { label: string; dot: string; chip: string }> = {
  planned: { label: 'Pianificato', dot: 'bg-primary', chip: 'bg-primary/8 text-primary' },
  completed: { label: 'Completato', dot: 'bg-success', chip: 'bg-success/10 text-success' },
  partial: { label: 'Parziale', dot: 'bg-warning', chip: 'bg-warning/12 text-warning' },
  skipped: { label: 'Saltato', dot: 'bg-muted-foreground', chip: 'bg-muted text-muted-foreground' },
  rescheduled: { label: 'Riprogrammato', dot: 'bg-primary/60', chip: 'bg-primary/8 text-primary' },
  review: { label: 'Ripasso', dot: 'bg-chart-4', chip: 'bg-secondary text-secondary-foreground' },
  unavailable: { label: 'Non disponibile', dot: 'bg-border', chip: 'bg-muted text-muted-foreground' },
  exam: { label: 'Esame', dot: 'bg-foreground', chip: 'bg-foreground text-background' },
}

export function SessionStatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  const s = SESSION_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        s.chip,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}

export const EXAM_STATUS: Record<ExamStatus, { label: string; className: string }> = {
  'on-track': { label: 'In linea', className: 'text-success' },
  adjusted: { label: 'Piano aggiornato', className: 'text-primary' },
  behind: { label: 'Da riequilibrare', className: 'text-warning' },
  'not-started': { label: 'Non iniziato', className: 'text-muted-foreground' },
}

export function ExamStatusLabel({ status }: { status: ExamStatus }) {
  const s = EXAM_STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', s.className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  )
}
