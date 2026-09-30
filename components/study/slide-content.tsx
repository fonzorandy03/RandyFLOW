'use client'
import type { Slide } from '@/lib/types'
export function SlideContent({ slide }: { slide: Slide }) {
  return (
    <div className="space-y-6">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">{slide.chapter}</p>
      <h2 className="text-2xl font-semibold tracking-tight">{slide.title}</h2>
      {slide.subtitle && <p>{slide.subtitle}</p>}
      {slide.bullets && (
        <ul className="list-disc space-y-4 pl-5">
          {slide.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {slide.formula && (
        <div className="rounded-xl bg-primary/5 p-6">
          <p className="break-words text-2xl font-medium">{slide.formula}</p>
          <p className="mt-4 text-sm text-muted-foreground">{slide.formulaCaption}</p>
        </div>
      )}
      {slide.diagram && (
        <div className="flex flex-wrap gap-3">
          {slide.diagram.map((d) => (
            <div key={d.label} className="rounded-xl border border-primary/30 p-4">
              <strong>{d.label}</strong>
              {d.children?.map((c) => (
                <p key={c} className="mt-2 text-sm">
                  {c}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
      {slide.table && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {slide.table.head.map((h) => (
                  <th key={h} className="border-b p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {slide.footnote && <p className="text-xs text-muted-foreground">{slide.footnote}</p>}
      <p className="pt-6 text-right text-xs text-muted-foreground">{slide.number}</p>
    </div>
  )
}
