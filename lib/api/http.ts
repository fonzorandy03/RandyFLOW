const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')
const BASE_URL = configuredBase
  ? configuredBase.endsWith('/api/v1')
    ? configuredBase
    : `${configuredBase}/api/v1`
  : undefined

/** Mock data is available only when explicitly enabled for tests or demos. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_DATA_MODE === 'mock'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  if (!BASE_URL) throw new ApiError('Backend non configurato. Imposta NEXT_PUBLIC_API_BASE_URL.', 0)
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
    throw new ApiError(problem?.message ?? `Richiesta non riuscita (${res.status})`, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: async <T>(path: string, file: File) => {
    if (!BASE_URL) throw new ApiError('Backend non configurato. Imposta NEXT_PUBLIC_API_BASE_URL.', 0)
    const body = new FormData()
    body.append('file', file)
    let res: Response
    try {
      res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body, credentials: 'include' })
    } catch {
      throw new ApiError('Backend non raggiungibile. Controlla la connessione e riprova.', 0)
    }
    if (!res.ok) {
      const problem = (await res.json().catch(() => null)) as { message?: string } | null
      throw new ApiError(problem?.message ?? `Upload non riuscito (${res.status})`, res.status)
    }
    return (await res.json()) as T
  },
}

let prepareMock = () => {}
let persistMock = () => {}
export function configureMockStore(prepare: () => void, persist: () => void) {
  prepareMock = prepare
  persistMock = persist
}
export function mockResponse<T>(factory: () => T, latency = 380): Promise<T> {
  return new Promise((resolve, reject) =>
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
  )
}
