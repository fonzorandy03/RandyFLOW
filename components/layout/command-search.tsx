'use client'

import Dialog from '@mui/material/Dialog'
import { ArrowRight, FileText, GraduationCap, Layers, ListChecks, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useDocuments, useExams } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { PRIMARY_NAV, SECONDARY_NAV } from './nav-items'
import { useShell } from './shell-context'

interface Result {
  id: string
  group: string
  label: string
  hint?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function CommandSearch() {
  const { searchOpen, setSearchOpen } = useShell()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const router = useRouter()
  const { data: exams } = useExams()
  const { data: docs } = useDocuments()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, setSearchOpen])

  const results = useMemo<Result[]>(() => {
    const all: Result[] = [
      ...[...PRIMARY_NAV, ...SECONDARY_NAV].map((n) => ({
        id: n.href,
        group: 'Pagine',
        label: n.label,
        href: n.href,
        icon: n.icon,
      })),
      {
        id: 'quiz',
        group: 'Azioni',
        label: 'Avvia un quiz',
        hint: 'GPS',
        href: '/quiz?exam=gps',
        icon: ListChecks,
      },
      {
        id: 'fc',
        group: 'Azioni',
        label: 'Ripassa le flashcard',
        hint: 'GPS',
        href: '/flashcard?exam=gps',
        icon: Layers,
      },
      { id: 'new', group: 'Azioni', label: 'Aggiungi un esame', href: '/esami/nuovo', icon: GraduationCap },
      ...(exams ?? []).map((e) => ({
        id: e.id,
        group: 'Esami',
        label: e.name,
        href: `/esami/${e.id}`,
        icon: GraduationCap,
      })),
      ...(docs ?? []).flatMap((d) =>
        d.chapters.map((c) => ({
          id: `${d.id}-${c.from}`,
          group: 'Capitoli',
          label: c.title,
          hint: `${d.name} · slide ${c.from}`,
          href: `/studio/${d.id}?page=${c.from}`,
          icon: FileText,
        })),
      ),
    ]
    const q = query.trim().toLowerCase()
    if (!q) return all.filter((r) => r.group !== 'Capitoli').slice(0, 10)
    return all.filter((r) => `${r.label} ${r.hint ?? ''}`.toLowerCase().includes(q)).slice(0, 12)
  }, [query, exams, docs])

  const close = () => {
    setSearchOpen(false)
    setQuery('')
    setActive(0)
  }
  const select = (r: Result) => {
    close()
    router.push(r.href)
  }

  let lastGroup = ''
  return (
    <Dialog
      open={searchOpen}
      onClose={close}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { className: 'self-start mt-[12vh]' } }}
      aria-label="Cerca"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(results.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (
              e.key === 'Enter' &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229 &&
              results[active]
            ) {
              select(results[active])
            }
          }}
          placeholder="Cerca pagine, esami, capitoli…"
          aria-label="Cerca"
          role="combobox"
          aria-expanded
          aria-controls="search-results"
          className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
          esc
        </kbd>
      </div>
      <ul id="search-results" role="listbox" className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
        {results.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nessun risultato per “{query}”.
          </li>
        )}
        {results.map((r, i) => {
          const header = r.group !== lastGroup ? r.group : null
          lastGroup = r.group
          const Icon = r.icon
          return (
            <li key={r.id} role="presentation">
              {header && (
                <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground first:pt-1">
                  {header}
                </p>
              )}
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(r)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  i === active && 'bg-muted',
                )}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{r.label}</span>
                {r.hint && <span className="truncate text-xs text-muted-foreground">{r.hint}</span>}
                {i === active && <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />}
              </button>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
