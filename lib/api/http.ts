import { withLoading } from '../loading'

const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')
const BASE_URL = configuredBase
  ? configuredBase.endsWith('/api/v1')
    ? configuredBase
    : `${configuredBase}/api/v1`
  : undefined

/** Mock data is available only when explicitly enabled for tests or demos. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_DATA_MODE === 'mock'
export const AUTH_TOKEN_KEY = 'randyflow-auth-token'

export function getAuthToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function executeRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (!BASE_URL) throw new ApiError('Backend non configurato. Imposta NEXT_PUBLIC_API_BASE_URL.', 0)
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Backend non raggiungibile. Controlla la connessione e riprova.', 0)
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as { message?: string } | null
    if (res.status === 401 && typeof window !== 'undefined')
      window.dispatchEvent(new Event('randyflow:unauthorized'))
    throw new ApiError(problem?.message ?? `Richiesta non riuscita (${res.status})`, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const label =
    method === 'GET'
      ? 'Carichiamo i tuoi contenuti'
      : method === 'DELETE'
        ? 'Aggiorniamo i tuoi dati'
        : 'Salviamo le modifiche'
  return withLoading(label, () => executeRequest<T>(method, path, body, signal))
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File) =>
    withLoading('Carichiamo il tuo file', async () => {
      if (!BASE_URL) throw new ApiError('Backend non configurato. Imposta NEXT_PUBLIC_API_BASE_URL.', 0)
      const body = new FormData()
      body.append('file', file)
      let res: Response
      try {
        res = await fetch(`${BASE_URL}${path}`, {
          method: 'POST',
          body,
          credentials: 'include',
          headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
        })
      } catch {
        throw new ApiError('Backend non raggiungibile. Controlla la connessione e riprova.', 0)
      }
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { message?: string } | null
        throw new ApiError(problem?.message ?? `Upload non riuscito (${res.status})`, res.status)
      }
      return (await res.json()) as T
    }),
  blob: (path: string) =>
    withLoading('Apriamo la tua dispensa', async () => {
      if (!BASE_URL) throw new ApiError('Backend non configurato. Imposta NEXT_PUBLIC_API_BASE_URL.', 0)
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : undefined,
      })
      if (!res.ok) throw new ApiError(`PDF non disponibile (${res.status})`, res.status)
      return res.blob()
    }),
}

let prepareMock = () => {}
let persistMock = () => {}
export function configureMockStore(prepare: () => void, persist: () => void) {
  prepareMock = prepare
  persistMock = persist
}
export function mockResponse<T>(factory: () => T, latency = 380): Promise<T> {
  return withLoading(
    'Prepariamo i tuoi contenuti',
    () =>
      new Promise<T>((resolve, reject) =>
        setTimeout(() => {
          try {
            prepareMock()
            const result = structuredClone(factory())
            persistMock()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }, latency),
      ),
  )
}
