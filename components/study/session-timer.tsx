'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Timer, Check } from 'lucide-react'
import { studyApi } from '@/lib/api/services'
import { refreshPlanData } from '@/lib/hooks'
import { useToast } from '../common/toast'

type Clock = { elapsed: number; started: number | null; fromPage: number }
export function SessionTimer({
  documentId,
  examId,
  page,
  label,
  targetMinutes = 25,
  breakMinutes = 5,
  autoBreak = false,
}: {
  documentId: string
  examId: string
  page: number
  label: string
  targetMinutes?: number
  breakMinutes?: number
  autoBreak?: boolean
}) {
  const key = `randyflow:timer:${documentId}`
  const clock = useRef<Clock>({ elapsed: 0, started: null, fromPage: page })
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const elapsed = () =>
    clock.current.elapsed +
    (clock.current.started === null ? 0 : Math.max(0, Date.now() - clock.current.started))
  const persist = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify(clock.current))
    } catch {
      /* Timer works without storage. */
    }
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null') as Clock | null
      if (
        saved &&
        Number.isFinite(saved.elapsed) &&
        saved.elapsed >= 0 &&
        (saved.started === null || Number.isFinite(saved.started)) &&
        Number.isInteger(saved.fromPage) &&
        saved.fromPage > 0
      )
        clock.current = saved
    } catch {
      /* Ignore invalid stored clocks. */
    }
    setRunning(clock.current.started !== null)
    const tick = () =>
      setSeconds(
        Math.floor(
          (clock.current.elapsed +
            (clock.current.started === null ? 0 : Math.max(0, Date.now() - clock.current.started))) /
            1000,
        ),
      )
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [key])
  const toggle = () => {
    if (clock.current.started !== null) {
      clock.current.elapsed = elapsed()
      clock.current.started = null
    } else {
      if (clock.current.elapsed === 0) clock.current.fromPage = page
      clock.current.started = Date.now()
    }
    setRunning(clock.current.started !== null)
    persist()
  }
  const save = async () => {
    if (saving) return
    clock.current.elapsed = elapsed()
    clock.current.started = null
    setRunning(false)
    persist()
    setSaving(true)
    setError('')
    try {
      await studyApi.log({
        documentId,
        examId,
        fromPage: Math.min(clock.current.fromPage, page),
        toPage: Math.max(clock.current.fromPage, page),
        minutes: Math.max(1, Math.round(clock.current.elapsed / 60000)),
        label,
      })
      clock.current = { elapsed: 0, started: null, fromPage: page }
      persist()
      setSeconds(0)
      toast('Sessione salvata. Un altro passo avanti!')
      await refreshPlanData()
    } catch {
      setError('Sessione non salvata. Il tempo è conservato: riprova.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="study-timer">
      <div className="flex items-center gap-3">
        <span className={`timer-symbol ${running ? 'is-running' : ''}`}>
          <Timer size={19} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="study-eyebrow">Tempo di concentrazione</p>
          <div className="flex items-baseline gap-2">
            <strong
              className="tabular text-2xl font-semibold tracking-tight"
              role="timer"
              aria-label="Tempo di studio"
            >
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
            </strong>
            <span className="text-xs text-muted-foreground">
              {running ? 'In corso' : seconds ? 'In pausa' : 'Pronto a iniziare'}
            </span>
          </div>
        </div>
        <button
          className="study-action ml-auto"
          onClick={toggle}
          disabled={saving}
          aria-label={running ? 'Metti in pausa il timer' : 'Avvia il timer'}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          <span>{running ? 'Pausa' : seconds ? 'Riprendi' : 'Inizia'}</span>
        </button>
        {seconds > 0 && (
          <button
            className="study-icon"
            onClick={() => void save()}
            disabled={saving}
            title="Salva sessione"
            aria-label="Salva sessione"
          >
            <Check size={18} />
          </button>
        )}
      </div>
      {autoBreak && seconds >= targetMinutes * 60 && (
        <p role="status" className="mt-2 text-xs text-primary">
          Ottimo lavoro. Concediti {breakMinutes} minuti di pausa.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
