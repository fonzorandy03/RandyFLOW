'use client'

import { FileText, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

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

/** Counts page objects in the raw PDF bytes; good enough for planning and editable afterwards. */
async function countPdfPages(file: File) {
  try {
    const text = new TextDecoder('latin1').decode(await file.arrayBuffer())
    const matches = text.match(/\/Type\s*\/Page[^s]/g)
    if (matches?.length) return matches.length
  } catch {}
  return Math.max(10, Math.round(file.size / 60_000))
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

  const add = async (files: FileList | null) => {
    if (!files?.length) return
    setReading(true)
    const added = await Promise.all(
      Array.from(files)
        .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
        .map(async (f) => ({
          id: `${f.name}-${f.size}-${Date.now()}`,
          name: f.name,
          pages: await countPdfPages(f),
          sizeLabel: sizeLabel(f.size),
          file: f,
        })),
    )
    setReading(false)
    onChange([...documents, ...added])
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
          Solo PDF · il file resta sul tuo dispositivo in questa demo
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

      {documents.length === 0 ? (
        <button
          type="button"
          onClick={addSample}
          className="self-center text-sm font-medium text-primary hover:underline"
        >
          Non hai un PDF a portata di mano? Usa un file di esempio
        </button>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.sizeLabel}</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Pagine</span>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={d.pages}
                  onChange={(e) =>
                    onChange(
                      documents.map((x) =>
                        x.id === d.id
                          ? { ...x, pages: Math.max(1, Math.min(2000, Number(e.target.value) || 1)) }
                          : x,
                      ),
                    )
                  }
                  className="tabular h-8 w-16 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                />
              </label>
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
      )}
    </div>
  )
}
