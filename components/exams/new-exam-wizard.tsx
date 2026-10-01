'use client'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { PageContainer } from '@/components/layout/app-shell'
import { useToast } from '@/components/common/toast'
import { AvailabilityEditor } from '@/components/plan/availability-editor'
import { examsApi, planApi, studyApi } from '@/lib/api/services'
import { TODAY, addDays, diffDays } from '@/lib/date'
import { refreshPlanData } from '@/lib/hooks'
import type { Availability, ISODate } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MaterialStep, type DraftDocument } from './wizard/material-step'
import { PlanPreview } from './wizard/plan-preview'
import { UnavailableDaysPicker } from './wizard/unavailable-days-picker'

const STEPS = ['Esame', 'Materiale', 'Disponibilità', 'Eccezioni', 'Anteprima'] as const

const DEFAULT_AVAILABILITY: Availability = { 0: 0, 1: 120, 2: 90, 3: 120, 4: 90, 5: 60, 6: 60 }

export interface ExamDraft {
  name: string
  date: ISODate
  description: string
  documents: DraftDocument[]
  availability: Availability
  unavailableDays: ISODate[]
  reviewDays: number
}

export function NewExamWizard() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<ExamDraft>({
    name: '',
    date: addDays(TODAY, 30),
    description: '',
    documents: [],
    availability: DEFAULT_AVAILABILITY,
    unavailableDays: [],
    reviewDays: 7,
  })
  const update = (patch: Partial<ExamDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const daysLeft = diffDays(draft.date, TODAY)
  const stepError = useMemo(() => {
    if (step === 0) {
      if (!draft.name.trim()) return 'Inserisci il nome dell’esame.'
      if (daysLeft < 3) return 'La data deve essere almeno tra 3 giorni.'
    }
    if (step === 1 && draft.documents.length === 0) return 'Carica almeno un documento.'
    if (step === 2 && Object.values(draft.availability).every((m) => m === 0))
      return 'Indica almeno un giorno disponibile.'
    return null
  }, [step, draft, daysLeft])

  const [touched, setTouched] = useState(false)

  const next = () => {
    setTouched(true)
    if (stepError) return
    setTouched(false)
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const create = async () => {
    setSaving(true)
    try {
      const exam = await examsApi.create({
        name: draft.name.trim(),
        date: draft.date,
        description: draft.description.trim() || undefined,
        documents: draft.documents.map((d) => ({ name: d.name, pages: d.pages })),
        availability: draft.availability,
        unavailableDays: draft.unavailableDays,
        reviewDays: draft.reviewDays,
      })
      for (const document of draft.documents) {
        if (document.file) await studyApi.uploadPdf(exam.id, document.file)
      }
      if (draft.documents.some((document) => document.file)) await planApi.recalculate(exam.id)
      await refreshPlanData()
      toast('Piano di studio creato')
      router.push(`/esami/${exam.id}`)
    } catch {
      toast('Non siamo riusciti a creare l’esame. Riprova.', 'info')
      setSaving(false)
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/esami"
            className="flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Annulla
          </Link>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">Nuovo esame</h1>
          <ol className="flex items-center gap-2" aria-label="Passaggi">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className="flex flex-1 flex-col gap-2"
                aria-current={i === step ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'h-1 rounded-full transition-colors duration-300',
                    i <= step ? 'bg-primary' : 'bg-border',
                  )}
                />
                <span
                  className={cn(
                    'hidden text-xs sm:block',
                    i === step ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <section key={step} className="animate-fade-up flex flex-col gap-6" aria-live="polite">
          {step === 0 && (
            <>
              <StepIntro title="Di che esame si tratta?" text="Ci servono solo nome e data per iniziare." />
              <TextField
                label="Nome dell’esame"
                placeholder="Es. Gestione dei Progetti Software"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                autoFocus
                fullWidth
                error={touched && !draft.name.trim()}
              />
              <TextField
                label="Data dell’esame"
                type="date"
                value={draft.date}
                onChange={(e) => update({ date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: addDays(TODAY, 3) } }}
                helperText={daysLeft > 0 ? `Mancano ${daysLeft} giorni` : undefined}
                error={touched && daysLeft < 3}
                fullWidth
              />
              <TextField
                label="Note (facoltative)"
                placeholder="Es. Scritto + orale, prof. Rossi"
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
            </>
          )}

          {step === 1 && (
            <>
              <StepIntro
                title="Carica il materiale"
                text="Carica i PDF e scegli in quale ordine studiarli. Il piano seguirà la tua scelta."
              />
              <MaterialStep documents={draft.documents} onChange={(documents) => update({ documents })} />
            </>
          )}

          {step === 2 && (
            <>
              <StepIntro
                title="Quanto tempo hai?"
                text="Indica i minuti disponibili per ogni giorno della settimana. Potrai cambiarli quando vuoi."
              />
              <AvailabilityEditor
                value={draft.availability}
                onChange={(availability) => update({ availability })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <StepIntro
                title="Giorni no e ripasso"
                text="Segna i giorni in cui non potrai studiare e quanti giorni vuoi tenere per il ripasso finale."
              />
              <UnavailableDaysPicker
                examDate={draft.date}
                value={draft.unavailableDays}
                onChange={(unavailableDays) => update({ unavailableDays })}
              />
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">Giorni di ripasso finale</legend>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 7, 14, 21].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update({ reviewDays: n })}
                      aria-pressed={draft.reviewDays === n}
                      className={cn(
                        'tabular h-10 min-w-12 rounded-xl border px-3 text-sm font-medium transition-colors',
                        draft.reviewDays === n
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary/40',
                      )}
                    >
                      {n === 0
                        ? 'Nessuno'
                        : n === 7
                          ? '1 settimana'
                          : n === 14
                            ? '2 settimane'
                            : n === 21
                              ? '3 settimane'
                              : n}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 4 && (
            <>
              <StepIntro
                title="Ecco il tuo piano"
                text="Ogni giorno saprai esattamente cosa studiare. Se salti una sessione, il piano si adatta."
              />
              <PlanPreview draft={draft} />
            </>
          )}
        </section>

        {touched && stepError && (
          <p role="alert" className="text-sm text-destructive">
            {stepError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            variant="text"
            color="inherit"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
            startIcon={<ArrowLeft className="size-4" />}
          >
            Indietro
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="contained" onClick={next} endIcon={<ArrowRight className="size-4" />}>
              Continua
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={create}
              disabled={saving}
              startIcon={<Check className="size-4" />}
            >
              {saving ? 'Creazione…' : 'Crea piano di studio'}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

function StepIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}
