'use client'

import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import { Check, CircleSlash, Clock } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/common/toast'
import { planApi } from '@/lib/api/services'
import { refreshPlanData } from '@/lib/hooks'
import type { StudySession } from '@/lib/types'

type Outcome = 'completed' | 'partial' | 'skipped'

export function SessionReport({ session, onDone }: { session: StudySession; onDone?: () => void }) {
  const toast = useToast()
  const [mode, setMode] = useState<'choose' | 'partial'>('choose')
  const [busy, setBusy] = useState<Outcome | null>(null)
  const total = (session.slideTo ?? 0) - (session.slideFrom ?? 0) + 1
  const [slides, setSlides] = useState(Math.min(total - 1, session.slidesDone ?? Math.round(total / 2)))

  if (session.slideFrom === undefined) return null

  const report = async (outcome: Outcome) => {
    setBusy(outcome)
    try {
      const { adjustment } = await planApi.reportSession(session.id, outcome, slides)
      await refreshPlanData()
      toast(adjustment ? adjustment.message : 'Sessione completata. Ottimo lavoro.')
      onDone?.()
    } catch {
      toast('Non siamo riusciti a salvare. Riprova.', 'info')
    } finally {
      setBusy(null)
    }
  }

  if (mode === 'partial')
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`slides-${session.id}`} className="text-sm font-medium">
            Quante slide hai completato?
          </label>
          <span className="tabular text-sm text-muted-foreground">
            {slides} / {total}
          </span>
        </div>
        <Slider
          id={`slides-${session.id}`}
          value={slides}
          min={0}
          max={total - 1}
          step={1}
          onChange={(_, v) => setSlides(v as number)}
          aria-label="Slide completate"
        />
        <p className="text-xs text-muted-foreground">
          Le {total - slides} slide rimanenti verranno distribuite nei prossimi giorni.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="text" color="inherit" onClick={() => setMode('choose')} disabled={!!busy}>
            Indietro
          </Button>
          <Button variant="contained" onClick={() => report('partial')} disabled={!!busy}>
            {busy ? 'Aggiornamento…' : 'Aggiorna il piano'}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="contained"
        size="small"
        onClick={() => report('completed')}
        disabled={!!busy}
        startIcon={<Check className="size-4" />}
      >
        Completata
      </Button>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        onClick={() => setMode('partial')}
        disabled={!!busy}
        startIcon={<Clock className="size-4" />}
      >
        Parziale
      </Button>
      <Button
        variant="text"
        color="inherit"
        size="small"
        onClick={() => report('skipped')}
        disabled={!!busy}
        startIcon={<CircleSlash className="size-4" />}
      >
        {busy === 'skipped' ? 'Riorganizzo…' : 'Saltata'}
      </Button>
    </div>
  )
}
