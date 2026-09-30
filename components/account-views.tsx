'use client'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import { useColorScheme } from '@mui/material/styles'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { PageContainer } from './layout/app-shell'
import { PageHeader } from './common/page-header'
import { MasteryIndicator } from './common/mastery-indicator'
import { ErrorState, LoadingState } from './common/states'
import { useStats, useExams, useMastery, useStudent } from '@/lib/hooks'
import { settingsApi, userApi } from '@/lib/api/services'
import type { Student } from '@/lib/types'
import { formatDay, formatDuration } from '@/lib/date'

export function StatsView() {
  const stats = useStats(),
    exams = useExams(),
    mastery = useMastery()
  if (stats.error || exams.error || mastery.error)
    return (
      <PageContainer>
        <ErrorState
          onRetry={() => {
            void stats.mutate()
            void exams.mutate()
            void mastery.mutate()
          }}
        />
      </PageContainer>
    )
  if (!stats.data || !exams.data || !mastery.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  const s = stats.data
  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader title="Statistiche" description="Il tuo percorso, tra progressi e prossimi passi." />
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Ore studiate', formatDuration(s.weekMinutes)],
            ['Slide completate', s.weekSlides],
            ['Task completati', `${s.taskCompletion}%`],
            ['Accuratezza quiz', `${s.quizAccuracy}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-card p-5">
              <dt className="text-xs text-muted-foreground">{label} · settimana</dt>
              <dd className="mt-2 text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Previsto vs reale · minuti al giorno</h2>
          <div className="space-y-3">
            {s.daily.map((d) => (
              <div key={d.date} className="grid grid-cols-[70px_1fr] items-center gap-3 text-xs">
                <span>{formatDay(d.date)}</span>
                <div>
                  <div
                    className="mb-1 rounded bg-primary/25 px-2 py-1"
                    style={{
                      width: `${Math.max(15, (d.plannedMin / Math.max(...s.daily.flatMap((x) => [x.plannedMin, x.studiedMin]))) * 100)}%`,
                    }}
                  >
                    Previsto {d.plannedMin}m
                  </div>
                  <div
                    className="rounded bg-primary px-2 py-1 text-primary-foreground"
                    style={{
                      width: `${Math.max(15, (d.studiedMin / Math.max(...s.daily.flatMap((x) => [x.plannedMin, x.studiedMin]))) * 100)}%`,
                    }}
                  >
                    Reale {d.studiedMin}m
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Progresso esami</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {exams.data.map((e) => (
              <Link key={e.id} href={`/esami/${e.id}`} className="space-y-3 rounded-2xl border bg-card p-5">
                <h3 className="font-medium">{e.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {e.slidesCompleted} / {e.totalSlides} slide
                </p>
                <progress className="w-full accent-primary" value={e.slidesCompleted} max={e.totalSlides} />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Mastery · padronanza degli argomenti</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {mastery.data.map((t) => (
              <article key={t.id} className="space-y-3 rounded-2xl border bg-card p-5">
                <MasteryIndicator topic={t} />
                <p className="text-xs text-muted-foreground">
                  {t.score >= 80
                    ? 'Argomento forte'
                    : t.needsReview
                      ? 'Argomento debole · da ripassare'
                      : 'In consolidamento'}
                </p>
                {t.needsReview && (
                  <>
                    <p className="text-sm">Ripasso {t.name} · 15 min</p>
                    <Button component={Link} href={`/planner?exam=${t.examId}`}>
                      Vedi nel planner
                    </Button>
                    <Button
                      component={Link}
                      href={`/studio/${exams.data?.find((e) => e.id === t.examId)?.documentIds[0]}?page=${t.slideFrom}`}
                    >
                      Ripassa ora
                    </Button>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
export function ProfileView() {
  const student = useStudent()
  if (student.error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => void student.mutate()} />
      </PageContainer>
    )
  if (!student.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  return <ProfileForm student={student.data} onSave={() => void student.mutate()} />
}
function ProfileForm({ student, onSave }: { student: Student; onSave: () => void }) {
  const [draft, setDraft] = useState(student),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('')
  return (
    <PageContainer>
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Profilo" description="Il tuo percorso universitario." />
        <form
          className="space-y-5 rounded-2xl border bg-card p-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await userApi.update({
                ...draft,
                initials: `${draft.firstName[0]}${draft.lastName[0]}`.toUpperCase(),
              })
              onSave()
              setMessage('Profilo salvato')
            } catch {
              setMessage('Salvataggio non riuscito. Riprova.')
            } finally {
              setBusy(false)
            }
          }}
        >
          {(
            [
              ['firstName', 'Nome'],
              ['lastName', 'Cognome'],
              ['email', 'Email'],
              ['university', 'Università'],
              ['course', 'Corso'],
              ['year', 'Anno'],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              value={draft[key]}
              required
              fullWidth
              type={key === 'email' ? 'email' : 'text'}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          ))}
          <Button type="submit" variant="contained" disabled={busy}>
            Salva profilo
          </Button>
          <p role="status" className="text-sm">
            {message}
          </p>
        </form>
      </div>
    </PageContainer>
  )
}
export function SettingsView() {
  const settings = useSWR('settings', settingsApi.get)
  if (settings.error)
    return (
      <PageContainer>
        <ErrorState onRetry={() => void settings.mutate()} />
      </PageContainer>
    )
  if (!settings.data)
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    )
  return <SettingsForm initial={settings.data} />
}
function SettingsForm({ initial }: { initial: Awaited<ReturnType<typeof settingsApi.get>> }) {
  const [draft, setDraft] = useState(initial),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  const { mode, setMode } = useColorScheme()
  return (
    <PageContainer>
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Impostazioni" description="Adatta RandyFLOW al tuo modo di studiare." />
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Aspetto</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['light', 'Light'],
                ['dark', 'Dark'],
                ['system', 'System'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={mode === value ? 'contained' : 'outlined'}
                onClick={() => setMode(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await settingsApi.update(draft)
              await mutate('settings')
              setMessage('Preferenze salvate')
            } catch {
              setMessage('Salvataggio non riuscito. Riprova.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <section className="space-y-5 rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Studio</h2>
            <TextField
              label="Durata sessione (minuti)"
              type="number"
              fullWidth
              value={draft.sessionMinutes}
              slotProps={{ htmlInput: { min: 1, max: 180 } }}
              onChange={(e) => setDraft({ ...draft, sessionMinutes: Number(e.target.value) })}
            />
            <TextField
              label="Durata pausa (minuti)"
              type="number"
              fullWidth
              value={draft.breakMinutes}
              slotProps={{ htmlInput: { min: 1, max: 60 } }}
              onChange={(e) => setDraft({ ...draft, breakMinutes: Number(e.target.value) })}
            />
            <label className="flex items-center justify-between text-sm">
              Promemoria pausa
              <Switch
                checked={draft.autoBreak}
                onChange={(_, v) => setDraft({ ...draft, autoBreak: v })}
                slotProps={{ input: { 'aria-label': 'Promemoria pausa' } }}
              />
            </label>
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Notifiche</h2>
            <label className="flex items-center justify-between text-sm">
              Notifiche nell’app
              <Switch
                checked={draft.notifications}
                onChange={(_, v) => setDraft({ ...draft, notifications: v })}
                slotProps={{ input: { 'aria-label': 'Notifiche nell’app' } }}
              />
            </label>
          </section>
          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Spiegazioni</h2>
            <label className="flex flex-wrap items-center gap-4 text-sm">
              Livello delle spiegazioni
              <select
                className="rounded border bg-card p-2"
                value={draft.explanationLevel}
                onChange={(e) => setDraft({ ...draft, explanationLevel: e.target.value })}
              >
                {['Semplice', 'Normale', 'Approfondito'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </section>
          <Button type="submit" variant="contained" disabled={busy}>
            Salva preferenze
          </Button>
          <p role="status" className="text-sm">
            {message}
          </p>
        </form>
        <section className="space-y-3 rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Profilo dimostrativo locale. Accesso e autenticazione saranno disponibili con il backend.
          </p>
          <Button component={Link} href="/profilo">
            Modifica profilo
          </Button>
        </section>
      </div>
    </PageContainer>
  )
}
