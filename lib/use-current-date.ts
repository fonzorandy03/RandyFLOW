'use client'

import { useSyncExternalStore } from 'react'
import { currentDate } from './date'

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000)
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

export function useCurrentDate() {
  return useSyncExternalStore(subscribe, currentDate, () => '')
}
