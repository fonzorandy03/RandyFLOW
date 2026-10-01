'use client'

import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import { CircleAlert as AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLoadingIndicator } from './loading-popup'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-border px-6 py-12 text-center"
    >
      <AlertCircle className="mb-3 size-5 text-destructive" aria-hidden />
      <h3 className="text-sm font-semibold">Non siamo riusciti a caricare i dati</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message ?? 'Controlla la connessione e riprova.'}</p>
      {onRetry && (
        <Button variant="outlined" size="small" className="mt-4" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Caricamento…' }: { label?: string }) {
  useLoadingIndicator(true, label)
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-muted-foreground" role="status">
      <span className="size-1.5 animate-pulse-soft rounded-full bg-primary" aria-hidden />
      {label}
    </div>
  )
}

export function SkeletonBlock({ className, height = 20 }: { className?: string; height?: number }) {
  return <Skeleton variant="rounded" height={height} className={className} />
}

export function PageSkeleton() {
  useLoadingIndicator(true, 'Prepariamo la pagina')
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Caricamento">
      <div className="flex flex-col gap-2">
        <Skeleton variant="rounded" width={220} height={32} />
        <Skeleton variant="rounded" width={320} height={18} />
      </div>
      <Skeleton variant="rounded" height={280} />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={120} />
      </div>
    </div>
  )
}
