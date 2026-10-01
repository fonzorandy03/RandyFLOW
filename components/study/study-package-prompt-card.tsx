'use client'
import Button from '@mui/material/Button'
import { Check, ClipboardCopy, Download } from 'lucide-react'
import { useState } from 'react'
import { STUDY_PACKAGE_PROMPT } from '@/lib/study-package-prompt'

export function StudyPackagePromptCard() {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(STUDY_PACKAGE_PROMPT)
      setCopied(true)
      setError('')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Apri il prompt qui sotto e copia il testo manualmente.')
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            01 · Prepara i contenuti
          </p>
          <h3 className="mt-2 text-lg font-semibold">Le tue dispense, spiegate pagina per pagina</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Scarica entrambi i file e allegali alla tua AI insieme ai PDF originali. Poi incolla il prompt:
            otterrai un file .study con spiegazioni, quiz e flashcard.
          </p>
        </div>
        <Button
          variant="contained"
          onClick={() => void copy()}
          startIcon={copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
        >
          {copied ? 'Prompt copiato' : 'Copia prompt'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['STUDY_PACKAGE_SPEC.md', 'la guida al formato', 'Le istruzioni per creare contenuti compatibili.'],
          [
            'study-package-v1.schema.json',
            'lo schema JSON',
            'La struttura che il file .study deve rispettare.',
          ],
        ].map(([file, label, description]) => (
          <a
            key={file}
            href={`/study-kit/${file}`}
            download={file}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Download size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Scarica {label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
            </span>
          </a>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <details className="rounded-xl border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-primary">
          Leggi il prompt completo
        </summary>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border bg-background/50 p-4 text-xs leading-6">
          {STUDY_PACKAGE_PROMPT}
        </pre>
      </details>
    </section>
  )
}
