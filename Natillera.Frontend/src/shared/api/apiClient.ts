import { ApiError } from '@/shared/api/apiError'
import { resolveDemoRequest } from '@/features/demo/api/demoClient'
import { readDemoRole } from '@/features/demo/model/demoSession'

export const UNAUTHORIZED_EVENT = 'natillera:unauthorized'

const apiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

interface ApiRequestOptions extends RequestInit {
  token?: string
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  // DEMO-02: in demo mode no request ever leaves the browser.
  const demoRole = readDemoRole()
  if (demoRole) return resolveDemoRequest<T>(path, options.method ?? 'GET', demoRole)

  const { token, headers, ...requestOptions } = options
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...requestOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })

    const body = await response.json().catch(() => null) as { message?: string } | null
    if (!response.ok) {
      if (response.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      throw new ApiError(response.status, body?.message ?? '')
    }

    return body as T
  } finally {
    window.clearTimeout(timeout)
  }
}
