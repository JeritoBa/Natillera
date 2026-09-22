import { ApiError } from '@/shared/api/apiError'

const apiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

interface ApiRequestOptions extends RequestInit {
  token?: string
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
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
      throw new ApiError(response.status, body?.message ?? '')
    }

    return body as T
  } finally {
    window.clearTimeout(timeout)
  }
}
