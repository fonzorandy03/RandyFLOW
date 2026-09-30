'use client'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { daysUntil } from '@/lib/date'
import { useExams } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { Logo } from '../common/page-header'
import { isActive, PRIMARY_NAV, SECONDARY_NAV } from './nav-items'
import { useShell } from './shell-context'

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  collapsed: boolean
  active: boolean
}) {
  const link = (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-ring',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon
        className={cn(
          'size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground',
          active && 'text-primary group-hover:text-primary',
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
  return collapsed ? (
    <Tooltip title={label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useShell()
  const { data: exams } = useExams()
  const upcoming = exams
    ?.map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
      aria-label="Navigazione principale"
    >
      <div
        className={cn('flex h-14 items-center px-4', collapsed ? 'justify-center px-0' : 'justify-between')}
      >
        <Link href="/" aria-label="RandyFLOW, vai a Oggi" className="rounded-md">
          <Logo collapsed={collapsed} />
        </Link>
        {!collapsed && (
          <Tooltip title="Comprimi barra laterale">
            <IconButton size="small" onClick={() => setCollapsed(true)} aria-label="Comprimi barra laterale">
              <PanelLeftClose className="size-4 text-muted-foreground" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-2">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} collapsed={collapsed} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      {!collapsed && upcoming && upcoming.length > 0 && (
        <div className="mt-8 px-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Prossimi esami
          </p>
          <ul className="flex flex-col gap-2.5">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-sidebar-foreground">{e.name}</span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">{e.days} gg</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-4">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} {...item} collapsed={collapsed} active={isActive(pathname, item.href)} />
        ))}
        {collapsed && (
          <Tooltip title="Espandi barra laterale" placement="right">
            <IconButton
              onClick={() => setCollapsed(false)}
              aria-label="Espandi barra laterale"
              className="mt-2 self-center"
              size="small"
            >
              <PanelLeftOpen className="size-4 text-muted-foreground" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </aside>
  )
}
