'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/theme/theme'
import { ToastProvider } from './common/toast'
import { AuthProvider } from '@/lib/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
