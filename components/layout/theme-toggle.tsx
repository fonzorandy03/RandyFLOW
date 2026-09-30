'use client'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  const resolved = mode === 'system' ? systemMode : mode
  const next = resolved === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? 'Passa al tema scuro' : 'Passa al tema chiaro'
  return (
    <Tooltip title={label}>
      <IconButton onClick={() => setMode(next)} aria-label={label} size="small" className="size-9">
        {resolved === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </IconButton>
    </Tooltip>
  )
}
