import type { ISODate, Weekday } from './types'

/** Calendar date in the application's Italian time zone, independent of UTC midnight. */
export function currentDate(now = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export const TODAY: ISODate = process.env.NEXT_PUBLIC_DATA_MODE === 'mock' ? '2026-09-30' : currentDate()

const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const MONTHS_LONG = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
]
const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const WEEKDAYS_LONG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Domenica',
  1: 'Lunedì',
  2: 'Martedì',
  3: 'Mercoledì',
  4: 'Giovedì',
  5: 'Venerdì',
  6: 'Sabato',
}

export function parseISO(date: ISODate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(date: Date): ISODate {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = parseISO(date)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000)
}

export function daysUntil(date: ISODate): number {
  return diffDays(date, process.env.NEXT_PUBLIC_DATA_MODE === 'mock' ? TODAY : currentDate())
}

export function weekday(date: ISODate): Weekday {
  return parseISO(date).getUTCDay() as Weekday
}

export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function formatDay(date: ISODate): string {
  const d = parseISO(date)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

export function formatDayUpper(date: ISODate): string {
  return formatDay(date).toUpperCase()
}

export function formatLong(date: ISODate): string {
  const d = parseISO(date)
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatWeekdayLong(date: ISODate): string {
  const d = parseISO(date)
  return `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`
}

export function formatWeekdayShort(date: ISODate): string {
  return WEEKDAYS_SHORT[parseISO(date).getUTCDay()]
}

export function monthLabel(year: number, month: number): string {
  const label = MONTHS_LONG[month]
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function relativeDay(date: ISODate): string {
  const diff = diffDays(date, process.env.NEXT_PUBLIC_DATA_MODE === 'mock' ? TODAY : currentDate())
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Domani'
  if (diff === -1) return 'Ieri'
  return formatWeekdayLong(date)
}
