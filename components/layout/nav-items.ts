import { BookOpen, CalendarDays, ChartColumn, GraduationCap, House, Settings, User } from 'lucide-react'

export const PRIMARY_NAV = [
  { href: '/', label: 'Oggi', icon: House },
  { href: '/esami', label: 'I miei esami', short: 'Esami', icon: GraduationCap },
  { href: '/planner', label: 'Planner', icon: CalendarDays },
  { href: '/studio', label: 'Studio', icon: BookOpen },
  { href: '/statistiche', label: 'Statistiche', short: 'Stats', icon: ChartColumn },
] as const

export const SECONDARY_NAV = [
  { href: '/profilo', label: 'Profilo', icon: User },
  { href: '/impostazioni', label: 'Impostazioni', icon: Settings },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
