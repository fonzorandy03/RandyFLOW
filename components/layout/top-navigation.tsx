'use client'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { BookOpen, GraduationCap, Layers, ListChecks, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '../common/page-header'
import { NotificationsPopover } from './notifications-popover'
import { useShell } from './shell-context'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

const QUICK_ACTIONS = [
  { label: 'Continua a studiare', href: '/studio/doc-gps', icon: BookOpen },
  { label: 'Avvia un quiz', href: '/quiz?exam=gps', icon: ListChecks },
  { label: 'Ripassa le flashcard', href: '/flashcard?exam=gps', icon: Layers },
  { label: 'Aggiungi un esame', href: '/esami/nuovo', icon: GraduationCap },
]

export function TopNavigation() {
  const { setSearchOpen } = useShell()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="md:hidden" aria-label="RandyFLOW, vai a Oggi">
        <Logo />
      </Link>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden h-9 w-full max-w-sm items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground md:flex"
      >
        <Search className="size-4" aria-hidden />
        <span>Cerca</span>
        <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[11px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip title="Cerca">
          <IconButton
            size="small"
            className="size-9 md:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Cerca"
          >
            <Search className="size-[18px]" />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<Plus className="size-4" />}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="menu"
          className="mr-1 hidden h-9 border-border px-3 text-foreground sm:inline-flex"
        >
          Nuovo
        </Button>
        <Menu
          anchorEl={anchor}
          open={!!anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { className: 'mt-2 min-w-[220px]' } }}
        >
          {QUICK_ACTIONS.map((a) => (
            <MenuItem
              key={a.href}
              onClick={() => {
                setAnchor(null)
                router.push(a.href)
              }}
            >
              <a.icon className="size-4 text-muted-foreground" />
              {a.label}
            </MenuItem>
          ))}
        </Menu>
        <NotificationsPopover />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
