'use client'

import Snackbar from '@mui/material/Snackbar'
import { CircleCheck as CheckCircle2, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'info'
}

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const show = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        key={toast?.id}
        open={!!toast}
        autoHideDuration={3600}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-[0_12px_32px_-12px_rgba(17,19,24,0.25)]"
        >
          {toast?.tone === 'info' ? (
            <Info className="size-4 text-primary" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          )}
          {toast?.message}
        </div>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
