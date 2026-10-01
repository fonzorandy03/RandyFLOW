'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { beginLoading, loadingStore } from '@/lib/loading'

export function useLoadingIndicator(active: boolean, label: string) {
  useEffect(() => {
    if (active) return beginLoading(label)
  }, [active, label])
}

export function LoadingPopup() {
  const label = useSyncExternalStore(
    loadingStore.subscribe,
    loadingStore.getSnapshot,
    loadingStore.getServerSnapshot,
  )
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const navigation = useRef<(() => void) | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(Boolean(label)), label ? 450 : 0)
    return () => window.clearTimeout(timer)
  }, [label])
  useEffect(() => {
    navigation.current?.()
    navigation.current = null
  }, [pathname])
  useEffect(() => {
    let timeout: number
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const anchor = event.target instanceof Element ? event.target.closest('a') : null
      if (!anchor || anchor.hasAttribute('download') || anchor.target === '_blank') return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      navigation.current?.()
      navigation.current = beginLoading('Apriamo la prossima pagina')
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        navigation.current?.()
        navigation.current = null
      }, 10000)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.clearTimeout(timeout)
      navigation.current?.()
    }
  }, [])
  if (!visible) return null
  return (
    <div className="loading-popup-layer" role="status" aria-live="polite" aria-atomic="true">
      <div className="loading-popup-card">
        <div className="loading-orbit" aria-hidden="true">
          <span />
          <div>
            <BookOpen size={26} strokeWidth={1.7} />
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-primary">RandyFLOW</p>
        <p className="mt-2 text-lg font-semibold">{label || 'Quasi pronto'}</p>
        <p className="mt-2 text-sm text-muted-foreground">Un momento, ci siamo.</p>
        <div className="loading-dots mt-5 flex justify-center gap-1.5" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  )
}
