'use client'
import Button from '@mui/material/Button'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { studyPackageApi } from '@/lib/api/services'
import { refreshPlanData } from '@/lib/hooks'
import { StudyPackageValidationError } from '@/lib/study-package'
import type { Exam, StudyPackage, StudyPackageSummary } from '@/lib/types'

export function StudyPackageImport({ exams }: { exams: Exam[] }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ package: StudyPackage; summary: StudyPackageSummary }>()
  const [issues, setIssues] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [examId, setExamId] = useState('')
  const select = async (file?: File) => {
    setPreview(undefined)
    setIssues([])
    setMessage('')
    if (!file) return
    if (!file.name.toLowerCase().match(/\.(study|json)$/)) {
      setIssues(['Seleziona un file .study o .json.'])
      return
    }
    setBusy(true)
    try {
      const result = await studyPackageApi.preview(await file.text())
      setPreview(result)
      const exact = exams.find((exam) => exam.name.toLowerCase() === result.package.exam.name.toLowerCase())
      setExamId(exact?.id ?? (exams.length === 1 ? exams[0].id : ''))
    } catch (error) {
      setIssues(
        error instanceof StudyPackageValidationError
          ? error.issues
          : [error instanceof Error ? error.message : 'File non valido.'],
      )
    } finally {
      setBusy(false)
    }
  }
  const install = async () => {
    if (!preview) return
    if (exams.length && !examId) {
      setIssues(['Scegli l’esame al quale collegare questo package.'])
      return
    }
    setBusy(true)
    try {
      const result = await studyPackageApi.import(preview.package, examId || undefined)
      await refreshPlanData()
      await mutate(
        (key) =>
          Array.isArray(key) && ['study-package-material', 'quiz', 'flashcards'].includes(String(key[0])),
      )
      setMessage(
        `${result.isUpdate ? 'Package aggiornato' : 'Package importato'}: progresso, sessioni, risultati, flashcard, mastery e statistiche personali sono preservati.`,
      )
      setPreview(undefined)
      if (input.current) input.current.value = ''
      router.push(`/esami/${encodeURIComponent(result.examId)}`)
    } catch (error) {
      setIssues([error instanceof Error ? error.message : 'Importazione non riuscita.'])
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Importa Study Package</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Carica un file .study o .json. Il contenuto didattico resta separato dai tuoi dati personali.
          </p>
        </div>
        <Button variant="contained" onClick={() => input.current?.click()} disabled={busy}>
          Scegli file
        </Button>
      </div>
      <input
        ref={input}
        hidden
        type="file"
        accept=".study,.json,application/json"
        onChange={(event) => void select(event.target.files?.[0])}
      />
      {issues.length > 0 && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">Validazione non superata</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      {preview && (
        <div className="mt-4 rounded-xl border p-4">
          <p className="text-xs font-semibold text-primary">
            ANTEPRIMA · {preview.summary.isUpdate ? 'AGGIORNAMENTO' : 'NUOVO PACKAGE'}
          </p>
          <h3 className="mt-1 font-semibold">{preview.summary.examName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisione {preview.summary.revision} · {preview.summary.materialCount} materiali ·{' '}
            {preview.summary.topicCount} argomenti · {preview.summary.quizCount} quiz ·{' '}
            {preview.summary.flashcardCount} flashcard · {preview.summary.examQuestionCount} domande d’esame
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {preview.package.materials.map((material) => (
              <span key={material.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                {material.name} · {material.pageCount} slide
              </span>
            ))}
          </div>
          {exams.length > 0 && (
            <label className="mt-4 block text-sm font-medium">
              Collega il package all’esame
              <select
                className="mt-2 block w-full rounded-lg border bg-card p-3"
                value={examId}
                onChange={(event) => setExamId(event.target.value)}
              >
                <option value="">Scegli un esame</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </label>
          )}
          <Button className="mt-4" variant="contained" onClick={install} disabled={busy}>
            {preview.summary.isUpdate ? 'Aggiorna package' : 'Importa package'}
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="mt-4 rounded-xl bg-success/10 p-3 text-sm text-success">
          {message}
        </p>
      )}
    </section>
  )
}
