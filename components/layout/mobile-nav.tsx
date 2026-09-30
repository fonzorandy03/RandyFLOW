'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isActive, PRIMARY_NAV } from './nav-items'

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-15 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors',
                  active && 'text-foreground',
                )}
              >
                <Icon className={cn('size-5', active && 'text-primary')} />
                {'short' in item ? item.short : item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
