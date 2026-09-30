import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {description && <div className="text-pretty text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <path
            d="M3 13.5c2.5 0 3.5-7 7-7s4.5 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="17" cy="13.5" r="1.6" fill="var(--primary)" />
        </svg>
      </span>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight">
          Randy<span className="text-primary">FLOW</span>
        </span>
      )}
    </span>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}
