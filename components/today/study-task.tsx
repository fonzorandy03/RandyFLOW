'use client'

import { Check } from 'lucide-react'
import { formatDuration } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { StudyTask as StudyTaskType } from '@/lib/types'

interface StudyTaskProps {
  task: StudyTaskType
  onToggle?: () => void
  disabled?: boolean
}

export function StudyTask({ task, onToggle, disabled }: StudyTaskProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={task.done}
        className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/70 disabled:pointer-events-none"
      >
        <span
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-input transition-all duration-200',
            task.done ? 'border-success bg-success text-background' : 'group-hover:border-foreground/40',
          )}
          aria-hidden
        >
          <Check
            className={cn(
              'size-3 transition-all duration-200',
              task.done ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
            strokeWidth={3}
          />
        </span>
        <span
          className={cn(
            'flex-1 text-sm transition-colors duration-200',
            task.done && 'text-muted-foreground line-through decoration-muted-foreground/40',
          )}
        >
          {task.label}
        </span>
        {task.durationMin > 0 && (
          <span className="tabular shrink-0 text-xs text-muted-foreground">
            {formatDuration(task.durationMin)}
          </span>
        )}
      </button>
    </li>
  )
}
