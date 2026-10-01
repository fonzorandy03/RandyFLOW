type Listener = () => void
const listeners = new Set<Listener>()
const pending = new Map<symbol, string>()
let snapshot = ''
function emit() {
  snapshot = [...pending.values()].at(-1) ?? ''
  listeners.forEach((listener) => listener())
}
export const loadingStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => '',
}
/** Each operation owns its release, so overlapping requests cannot hide each other. */
export function beginLoading(label = 'Prepariamo il tuo spazio di studio') {
  if (typeof window === 'undefined') return () => {}
  const id = Symbol()
  pending.set(id, label)
  emit()
  return () => {
    if (pending.delete(id)) emit()
  }
}
export async function withLoading<T>(label: string, operation: () => Promise<T>): Promise<T> {
  const finish = beginLoading(label)
  try {
    return await operation()
  } finally {
    finish()
  }
}
