'use client'

import { FileText, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { studyApi } from '@/lib/api/services'
import { MaterialOrderControls, moveMaterial } from '@/components/study/material-order-controls'

export interface DraftDocument {
  id: string
  name: string
  pages: number
  sizeLabel: string
  file?: File
}

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function MaterialStep({
  documents,
  onChange,
}: {
  documents: DraftDocument[]
  onChange: (docs: DraftDocument[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')

  const add = async (files: FileList | null) => {
    if (!files?.length) return
    setReading(true)
    setError('')
    try {
      const added = await Promise.all(
        Array.from(files)
          .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
          .map(async (f) => {
            const inspected = await studyApi.inspectPdf(f)
            return {
              id: `${f.name}-${f.size}-${Date.now()}`,
              name: f.name,
              pages: inspected.pages,
              sizeLabel: sizeLabel(f.size),
              file: f,
            }
          }),
      )
      onChange([...documents, ...added])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Non è stato possibile leggere il PDF.')
    } finally {
      setReading(false)
    }
  }

  const addSample = () =>
    onChange([
      ...documents,
      { id: `sample-${Date.now()}`, name: 'Slide del corso.pdf', pages: 120, sizeLabel: '8.4 MB' },
    ])

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          add(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <Upload className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium">
          {reading ? 'Lettura del file…' : 'Trascina qui i PDF o scegli un file'}
        </span>
        <span className="text-xs text-muted-foreground">
          Solo PDF · il numero di pagine viene letto direttamente dal documento
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <button
          type="button"
          onClick={addSample}
          className="self-center text-sm font-medium text-primary hover:underline"
        >
          Non hai un PDF a portata di mano? Usa un file di esempio
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Ordine di studio: usa le frecce per scegliere quale dispensa studiare prima. Il piano seguirà
            questo ordine.
          </p>
          <ul className="flex flex-col gap-2" aria-label="Ordine di studio delle dispense">
            {documents.map((d, index) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                <MaterialOrderControls
                  name={d.name}
                  index={index}
                  total={documents.length}
                  disabled={reading}
                  onMove={(direction) => onChange(moveMaterial(documents, index, direction))}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.sizeLabel}</span>
                </div>
                <span className="tabular rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {d.pages} pagine
                </span>
                <button
                  type="button"
                  onClick={() => onChange(documents.filter((x) => x.id !== d.id))}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Rimuovi ${d.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
