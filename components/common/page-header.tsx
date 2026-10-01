import Image from 'next/image'
import logoImage from '@/logo/Logo Senza Sfondo.png'
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
      <Image src={logoImage} alt="" width={28} height={28} className="size-7 shrink-0 rounded-lg object-contain" />
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
