'use client'

import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import { useState } from 'react'
import { Check, FileText, X } from 'lucide-react'
import { studyApi } from '@/lib/api/services'
import { refreshPlanData } from '@/lib/hooks'
import { pageTypeLabel } from '@/lib/materials'
import type { StudyDocument } from '@/lib/types'
import Link from 'next/link'
import { studyHref } from '@/lib/routes'

export function MaterialPagesDialog({
  document: doc,
  onClose,
}: {
  document: StudyDocument | null
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState<StudyDocument | null>(null)
  const current = updated?.id === doc?.id ? updated : doc
  const apply = async (action: () => Promise<StudyDocument>) => {
    setBusy(true)
    setError('')
    try {
      setUpdated(await action())
      await refreshPlanData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Aggiornamento non riuscito.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={!!doc}
      onClose={busy ? undefined : onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="material-pages-title"
    >
      {current && (
        <div className="p-5 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-primary">PAGINE DA STUDIARE</p>
              <h2 id="material-pages-title" className="mt-2 break-words text-lg font-semibold">
                {current.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {current.studyablePages} da studiare · {current.pages - current.studyablePages} escluse ·{' '}
                {current.pages} pagine nel PDF
              </p>
            </div>
            <button
              className="study-icon"
              aria-label="Chiudi gestione pagine"
              disabled={busy}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            La numerazione coincide con il PDF originale. Copertine, indici e separatori riconosciuti sono
            esclusi dal piano. Controlla le pagine dubbie e includi o escludi quelle che preferisci.
          </p>
          <div className="my-4 flex flex-wrap gap-2">
            <Button
              startIcon={<FileText size={16} />}
              variant="outlined"
              disabled={busy || current.hasFile === false}
              onClick={() => void apply(() => studyApi.analyze(current.id))}
            >
              {busy ? 'Aggiornamento…' : current.analyzed ? 'Ripeti analisi PDF' : 'Analizza PDF'}
            </Button>
            <Button component={Link} href={studyHref(current.id, null, current.lastPage)}>
              Apri dispensa
            </Button>
          </div>
          {error && (
            <p role="alert" className="my-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: current.pages }, (_, i) => i + 1).map((page) => {
              const info = current.pageSelection?.find((item) => item.page === page)
              const included = info?.studyable ?? true
              return (
                <div
                  key={page}
                  className={`rounded-xl border p-3 ${included ? 'border-primary/20 bg-primary/5' : 'bg-muted/60'}`}
                >
                  <Link
                    className="text-sm font-semibold hover:text-primary"
                    href={studyHref(current.id, null, page)}
                  >
                    Pagina {page}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pageTypeLabel[info?.type ?? 'unclassified'] ?? 'Contenuto'}
                    {info?.source === 'manual' ? ' · scelta tua' : ''}
                  </p>
                  <button
                    disabled={busy}
                    aria-label={`${included ? 'Escludi' : 'Includi'} pagina ${page}`}
                    aria-pressed={included}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"
                    onClick={() => void apply(() => studyApi.selectPage(current.id, page, !included))}
                  >
                    {included ? <Check size={13} /> : <X size={13} />}
                    {included ? 'Da studiare' : 'Esclusa dal piano'}
                  </button>
                  {info?.source === 'manual' && (
                    <button
                      disabled={busy}
                      className="mt-2 text-[11px] text-muted-foreground underline"
                      onClick={() => void apply(() => studyApi.selectPage(current.id, page, null))}
                    >
                      Ripristina analisi
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Dialog>
  )
}
