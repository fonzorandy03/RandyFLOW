'use client'

import { createContext, useContext, useMemo, useState } from 'react'

interface ShellState {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  focus: boolean
  setFocus: (v: boolean) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
}

const ShellContext = createContext<ShellState | null>(null)

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [focus, setFocus] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const value = useMemo(
    () => ({ collapsed, setCollapsed, focus, setFocus, searchOpen, setSearchOpen }),
    [collapsed, focus, searchOpen],
  )
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell deve essere usato dentro ShellProvider')
  return ctx
}
