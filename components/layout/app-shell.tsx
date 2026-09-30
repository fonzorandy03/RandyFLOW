'use client'

import { AppSidebar } from './app-sidebar'
import { CommandSearch } from './command-search'
import { MobileNav } from './mobile-nav'
import { ShellProvider, useShell } from './shell-context'
import { TopNavigation } from './top-navigation'

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { focus } = useShell()
  return (
    <div className="flex h-dvh overflow-hidden">
      {!focus && <AppSidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!focus && <TopNavigation />}
        <main id="main" className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
      {!focus && <MobileNav />}
      <CommandSearch />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ShellFrame>{children}</ShellFrame>
    </ShellProvider>
  )
}

export function PageContainer({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`mx-auto w-full animate-fade-up px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}
    >
      {children}
    </div>
  )
}
