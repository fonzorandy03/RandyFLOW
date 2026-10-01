'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { Download, FileWarning, LoaderCircle } from 'lucide-react'

export function PdfReader({
  url,
  page,
  zoom,
  name,
}: {
  url: string
  page: number
  zoom: number
  name: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const text = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [width, setWidth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    let task: ReturnType<typeof import('pdfjs-dist').getDocument> | undefined
    void import('pdfjs-dist')
      .then((lib) => {
        if (!active) return
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        task = lib.getDocument({
          url,
          cMapUrl: '/pdf-cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdf-fonts/',
          wasmUrl: '/pdf-wasm/',
        })
        return task.promise.then((document) => {
          if (active) setPdf(document)
        })
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
      void task?.destroy()
    }
  }, [url])
  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width - 48)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!pdf || !width) return
    let active = true
    let render: RenderTask | undefined
    let layer: InstanceType<typeof import('pdfjs-dist').TextLayer> | undefined
    setLoading(true)
    setError(false)
    container.current?.scrollTo({ top: 0, left: 0 })
    void (async () => {
      const sheet = await pdf.getPage(page)
      if (!active || !canvas.current || !text.current) return
      const base = sheet.getViewport({ scale: 1 })
      const viewport = sheet.getViewport({ scale: ((Math.min(width, 1100) / base.width) * zoom) / 100 })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.current.width = Math.floor(viewport.width * ratio)
      canvas.current.height = Math.floor(viewport.height * ratio)
      canvas.current.style.width = `${viewport.width}px`
      canvas.current.style.height = `${viewport.height}px`
      render = sheet.render({
        canvas: canvas.current,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      })
      await render.promise
      if (!active) return
      const lib = await import('pdfjs-dist')
      if (!active || !text.current) return
      text.current.replaceChildren()
      text.current.style.setProperty('--scale-factor', String(viewport.scale))
      text.current.style.setProperty('--total-scale-factor', String(viewport.scale))
      layer = new lib.TextLayer({
        textContentSource: await sheet.getTextContent(),
        container: text.current,
        viewport,
      })
      await layer.render()
      if (active) setLoading(false)
    })().catch((reason: Error) => {
      if (active && reason.name !== 'RenderingCancelledException') {
        setError(true)
        setLoading(false)
      }
    })
    return () => {
      active = false
      render?.cancel()
      layer?.cancel()
    }
  }, [pdf, page, zoom, width])
  return (
    <div ref={container} className="pdf-stage scrollbar-thin" aria-busy={loading}>
      {loading && (
        <div className="pdf-loading" role="status">
          <LoaderCircle size={18} className="animate-spin" /> Caricamento pagina…
        </div>
      )}
      {error ? (
        <div className="study-empty">
          <FileWarning size={28} />
          <h3>Non riesco a mostrare questa pagina</h3>
          <p>Puoi aprire il PDF originale e continuare a leggere.</p>
          <a className="study-action" href={url} target="_blank" rel="noreferrer">
            <Download size={16} />
            Apri PDF
          </a>
        </div>
      ) : null}
      <div
        className="pdf-sheet"
        style={{ visibility: loading ? 'hidden' : 'visible', display: error ? 'none' : undefined }}
      >
        <canvas ref={canvas} aria-label={`${name}, pagina ${page}`} />
        <div ref={text} className="textLayer" />
      </div>
    </div>
  )
}
