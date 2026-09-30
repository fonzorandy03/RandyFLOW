'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useEffect, useState } from 'react'
import { examsApi, planApi } from '@/lib/api/services'
import { WEEKDAY_ORDER, formatDuration } from '@/lib/date'
import { refreshPlanData } from '@/lib/hooks'
import type { Availability } from '@/lib/types'
import { useToast } from '../common/toast'
import { AvailabilityEditor } from './availability-editor'

interface Props {
  open: boolean
  examId: string
  onClose: () => void
  onSaved?: () => void
}

export function AvailabilityDialog({ open, examId, onClose, onSaved }: Props) {
  const [value, setValue] = useState<Availability | null>(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    let active = true
    examsApi.get(examId).then((e) => active && setValue({ ...e.availability }))
    return () => {
      active = false
    }
  }, [open, examId])

  const total = value ? WEEKDAY_ORDER.reduce<number>((s, d) => s + value[d], 0) : 0

  const save = async () => {
    if (!value) return
    setSaving(true)
    try {
      await planApi.updateAvailability(examId, value)
      await refreshPlanData()
      toast('Disponibilità aggiornata. Il piano è stato ricalcolato.')
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="availability-title">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h2 id="availability-title" className="text-lg font-semibold tracking-tight">
            Modifica disponibilità
          </h2>
          <p className="text-sm text-muted-foreground">
            Indica quanto tempo puoi dedicare ogni giorno. Ricalcoleremo le prossime sessioni.
          </p>
        </div>
        {value ? (
          <AvailabilityEditor value={value} onChange={setValue} />
        ) : (
          <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="tabular text-sm text-muted-foreground">
            Totale settimanale <span className="font-semibold text-foreground">{formatDuration(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button color="inherit" onClick={onClose}>
              Annulla
            </Button>
            <Button variant="contained" onClick={save} disabled={!value || saving}>
              {saving ? 'Ricalcolo…' : 'Salva e ricalcola'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
