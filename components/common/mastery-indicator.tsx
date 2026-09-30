import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MasteryTopic } from '@/lib/types'

export function masteryTone(score: number) {
  if (score >= 80) return { bar: 'bg-success', text: 'text-success', label: 'Solido' }
  if (score >= 60) return { bar: 'bg-primary', text: 'text-primary', label: 'In crescita' }
  return { bar: 'bg-warning', text: 'text-warning', label: 'Da ripassare' }
}

export function MasteryIndicator({ topic, compact = false }: { topic: MasteryTopic; compact?: boolean }) {
  const tone = masteryTone(topic.score)
  const TrendIcon = topic.trend === 'up' ? ArrowUpRight : topic.trend === 'down' ? ArrowDownRight : Minus
  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{topic.name}</span>
          {topic.needsReview && (
            <span className="shrink-0 rounded-full bg-warning/12 px-1.5 py-0.5 text-[11px] font-medium text-warning">
              Da ripassare
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!compact && <TrendIcon className={cn('size-3.5', tone.text)} aria-hidden />}
          <span className="tabular text-sm font-semibold">{topic.score}%</span>
        </div>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Padronanza ${topic.name}`}
        aria-valuenow={topic.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', tone.bar)}
          style={{ width: `${topic.score}%` }}
        />
      </div>
      {!compact && (
        <span className="text-xs text-muted-foreground">
          Slide {topic.slideFrom}–{topic.slideTo} · {topic.attempts} risposte
        </span>
      )}
    </div>
  )
}
