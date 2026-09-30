'use client'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { ArrowRight, RefreshCw, Scale, X } from 'lucide-react'
import { useState } from 'react'
import { formatDuration } from '@/lib/date'
import { refreshPlanData } from '@/lib/hooks'
import { planApi } from '@/lib/api/services'
import type { PlanAdjustment } from '@/lib/types'
import { useToast } from '../common/toast'
import { AvailabilityDialog } from './availability-dialog'

interface Props {
  adjustment: PlanAdjustment
  examName?: string
}

export function PlanAdjustmentNotice({ adjustment, examName }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const toast = useToast()

  const resolve = async (action: 'apply' | 'keep' | 'dismiss') => {
    setBusy(action)
    try {
      await planApi.resolveAdjustment(adjustment.id, action)
      setHidden(true)
      await refreshPlanData()
      if (action === 'apply') toast('Piano aggiornato. Le prossime sessioni riflettono il nuovo ritmo.')
      if (action === 'keep') toast('Piano attuale mantenuto.', 'info')
    } finally {
      setBusy(null)
    }
  }

  if (hidden) return null
  const behind = adjustment.kind === 'behind'
  const Icon = behind ? Scale : RefreshCw

  return (
    <div role="status" className="animate-fade-up rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex gap-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              {examName && (
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {examName}
                </p>
              )}
              <p className="text-sm font-semibold">{adjustment.title}</p>
              <p className="text-pretty text-sm leading-6 text-muted-foreground">{adjustment.message}</p>
            </div>
            {!behind && (
              <IconButton
                size="small"
                onClick={() => resolve('dismiss')}
                aria-label="Chiudi avviso"
                className="-mr-1.5 -mt-1.5 shrink-0"
              >
                <X className="size-4" />
              </IconButton>
            )}
          </div>

          {(adjustment.plannedSlides !== undefined || adjustment.beforeMin !== undefined) && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {adjustment.plannedSlides !== undefined && (
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Ieri</dt>
                  <dd className="tabular font-medium">
                    {adjustment.completedSlides} / {adjustment.plannedSlides} completate
                  </dd>
                </div>
              )}
              {adjustment.beforeMin !== undefined && adjustment.afterMin !== undefined && (
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Sessione di oggi</dt>
                  <dd className="tabular flex items-center gap-2 font-medium">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                      {formatDuration(adjustment.beforeMin)}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-label="diventa" />
                    {formatDuration(adjustment.afterMin)}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {behind && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="contained" size="small" onClick={() => resolve('apply')} disabled={!!busy}>
                {busy === 'apply' ? 'Aggiornamento…' : 'Aggiorna piano'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                className="border-border"
                onClick={() => setAvailabilityOpen(true)}
                disabled={!!busy}
              >
                Modifica disponibilità
              </Button>
              <Button color="inherit" size="small" onClick={() => resolve('keep')} disabled={!!busy}>
                Mantieni piano attuale
              </Button>
            </div>
          )}
        </div>
      </div>
      {behind && (
        <AvailabilityDialog
          open={availabilityOpen}
          examId={adjustment.examId}
          onClose={() => setAvailabilityOpen(false)}
          onSaved={() => setHidden(true)}
        />
      )}
    </div>
  )
}
