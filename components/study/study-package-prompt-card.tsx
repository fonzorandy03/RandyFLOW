'use client'
import Button from '@mui/material/Button'
import { Check, ClipboardCopy, FileText } from 'lucide-react'
import { useState } from 'react'
import { STUDY_PACKAGE_PROMPT } from '@/lib/study-package-prompt'

export function StudyPackagePromptCard() {
  const [copied,setCopied]=useState(false)
  const copy=async()=>{await navigator.clipboard.writeText(STUDY_PACKAGE_PROMPT);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}
  return <section className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[.035]">
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></span><div><h2 className="font-semibold">Genera il tuo file .study</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Allega il PDF alla tua AI e incolla questo prompt. Richiede spiegazione, riassunto, concetti, esempi, quiz e flashcard per ogni singola pagina, con un controllo completo dei riferimenti.</p></div></div>
      <Button variant="contained" onClick={() => void copy()} startIcon={copied?<Check className="size-4"/>:<ClipboardCopy className="size-4"/>}>{copied?'Copiato':'Copia prompt'}</Button>
    </div>
    <details className="border-t border-primary/10"><summary className="cursor-pointer px-5 py-3 text-sm font-medium text-primary">Mostra il prompt completo</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t bg-background/70 p-5 text-xs leading-6">{STUDY_PACKAGE_PROMPT}</pre></details>
  </section>
}
