'use client'

import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { examsApi } from '@/lib/api/services'
import { currentDate, addDays } from '@/lib/date'
import { refreshPlanData } from '@/lib/hooks'
import type { Exam } from '@/lib/types'
import { UnavailableDaysPicker } from '../exams/wizard/unavailable-days-picker'

export function PlanSettingsDialog({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const today = currentDate()
  const [startDate, setStartDate] = useState(exam.startDate ?? today)
  const [unavailableDays, setUnavailableDays] = useState(exam.unavailableDays)
  const [reviewDays, setReviewDays] = useState(exam.reviewDays)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await examsApi.updatePlan(exam.id, { startDate, unavailableDays, reviewDays })
      await refreshPlanData()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Piano non aggiornato. Riprova.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="plan-settings-title"
    >
      <div className="flex flex-col gap-5 p-5 md:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={20} />
            </span>
            <h2 id="plan-settings-title" className="text-xl font-semibold">
              Il piano segue i tuoi impegni
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Se un giorno non riesci a studiare, selezionalo qui. Redistribuiremo le pagine rimanenti nei
              giorni disponibili, mantenendo i progressi e l’ordine delle dispense.
            </p>
          </div>
          <button className="study-icon" aria-label="Chiudi modifica piano" disabled={busy} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <fieldset disabled={busy} className="flex flex-col gap-5">
          <TextField
            label="Inizio del piano"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: addDays(exam.date, -reviewDays) } }}
            helperText="Se la data è passata, ripianifichiamo da oggi le pagine ancora da studiare."
          />
          <UnavailableDaysPicker
            examDate={exam.date}
            startDate={startDate < today ? startDate : today}
            value={unavailableDays}
            onChange={setUnavailableDays}
          />
          <TextField
            label="Giorni per il ripasso finale"
            type="number"
            value={reviewDays}
            onChange={(e) => setReviewDays(Math.max(0, Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 0, max: 60 } }}
          />
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button onClick={onClose} disabled={busy} color="inherit">
            Annulla
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={busy || !startDate}>
            {busy ? 'Ricalcolo in corso…' : 'Salva e aggiorna il piano'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
