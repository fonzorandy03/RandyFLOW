'use client'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { studyPackageApi } from '@/lib/api/services'
import { refreshPlanData } from '@/lib/hooks'
import { useDocuments } from '@/lib/hooks'
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
  const documents = useDocuments()
  const [materialMap, setMaterialMap] = useState<Record<string, string>>({})
  if (exams.length === 0)
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Importa Study Package</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Prima crea un esame e il relativo piano di studio. Il file .study potrà essere caricato soltanto
          dopo la creazione del piano.
        </p>
        <Button component={Link} href="/esami/nuovo" variant="contained" className="mt-4">
          Crea esame e piano
        </Button>
      </section>
    )
  const select = async (file?: File) => {
    setPreview(undefined)
    setMaterialMap({})
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
    if (!examId) {
      setIssues(['Scegli l’esame al quale collegare questo package.'])
      return
    }
    setBusy(true)
    try {
      const selectedDocuments = documents.data?.filter((doc) => doc.examId === examId) ?? []
      const mapping: Record<string, string> = {}
      for (const material of preview.package.materials) {
        const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const matches = selectedDocuments.filter((doc) => normalize(doc.name) === normalize(material.name))
        const selected = materialMap[material.id] || (matches.length === 1 ? matches[0].id : '')
        if (!selected) throw new Error(`Scegli il PDF al quale associare ${material.name}.`)
        const doc = selectedDocuments.find((item) => item.id === selected)
        if (!doc || doc.pages !== material.pageCount)
          throw new Error(
            `Il numero di pagine di ${material.name} non coincide con il PDF scelto. Usa la numerazione fisica del documento.`,
          )
        if (Object.values(mapping).includes(selected))
          throw new Error('Ogni materiale deve essere associato a una dispensa diversa.')
        mapping[material.id] = selected
      }
      const result = await studyPackageApi.import(preview.package, examId, mapping)
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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            02 · Porta qui il risultato
          </p>
          <h3 className="mt-2 text-lg font-semibold">Attiva il tuo assistente di studio</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Carica il file .study o .json ricevuto dalla tua AI e collegalo alle dispense corrette.
          </p>
        </div>
        <Button variant="contained" onClick={() => input.current?.click()} disabled={busy}>
          Importa file .study
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
                onChange={(event) => {
                  setExamId(event.target.value)
                  setMaterialMap({})
                }}
              >
                <option value="">Scegli un esame</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {examId && (
            <div className="mt-5 space-y-3 rounded-xl bg-muted/50 p-4">
              <h4 className="text-sm font-semibold">Associa ogni contenuto alla sua dispensa</h4>
              <p className="text-xs leading-5 text-muted-foreground">
                Scegli il PDF originale corretto. Il numero di pagine deve coincidere; i file non vengono
                abbinati in base al loro ordine.
              </p>
              {preview.package.materials.map((material) => {
                const available = documents.data?.filter((doc) => doc.examId === examId) ?? []
                const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
                const matches = available.filter((doc) => normalize(doc.name) === normalize(material.name))
                return (
                  <label key={material.id} className="block text-xs font-medium">
                    {material.name} · {material.pageCount} pagine nel package
                    <select
                      aria-label={`PDF per ${material.name}`}
                      className="mt-2 block w-full rounded-lg border bg-card p-3 text-sm"
                      value={materialMap[material.id] ?? (matches.length === 1 ? matches[0].id : '')}
                      onChange={(event) =>
                        setMaterialMap((current) => ({ ...current, [material.id]: event.target.value }))
                      }
                    >
                      <option value="">Seleziona la dispensa corretta</option>
                      {available.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} · {doc.pages} pagine
                        </option>
                      ))}
                    </select>
                  </label>
                )
              })}
            </div>
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
