'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'

export function MaterialOrderControls({
  name,
  index,
  total,
  disabled,
  onMove,
}: {
  name: string
  index: number
  total: number
  disabled?: boolean
  onMove: (direction: -1 | 1) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="mr-1 text-xs font-semibold tabular-nums text-primary">{index + 1}</span>
      <button
        type="button"
        className="study-icon disabled:opacity-30"
        disabled={disabled || index === 0}
        aria-label={`Studia prima: ${name}`}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        className="study-icon disabled:opacity-30"
        disabled={disabled || index === total - 1}
        aria-label={`Studia dopo: ${name}`}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={16} />
      </button>
    </div>
  )
}

export function moveMaterial<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const reordered = [...items]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
  return reordered
}
