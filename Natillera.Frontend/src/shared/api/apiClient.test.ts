import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, isPeriodScopedPath, setSavingPeriodId } from '@/shared/api/apiClient'

const okResponse = () => new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('apiRequest X-Saving-Id header (PER-04)', () => {
  const fetchMock = vi.fn()
  let store: Record<string, string> = {}
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(() => Promise.resolve(okResponse()))
    vi.stubGlobal('fetch', fetchMock)
    // The suite runs in node: provide the few browser globals apiRequest touches.
    store = {}
    vi.stubGlobal('window', { setTimeout, clearTimeout, dispatchEvent: () => true })
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v }, removeItem: (k: string) => { delete store[k] } })
  })
  afterEach(() => { setSavingPeriodId(null); vi.unstubAllGlobals() })

  const sentHeaders = () => (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>

  it('adds the header to period scoped requests', async () => {
    setSavingPeriodId('p-1')
    await apiRequest('/api/loans', { token: 't' })
    expect(sentHeaders()['X-Saving-Id']).toBe('p-1')
  })

  it('does not add it to auth or saving-periods requests', async () => {
    setSavingPeriodId('p-1')
    await apiRequest('/api/auth/login', { method: 'POST' })
    await apiRequest('/api/saving-periods', { token: 't' })
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).not.toHaveProperty('X-Saving-Id')
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).not.toHaveProperty('X-Saving-Id')
  })

  it('does not add it when no period is selected', async () => {
    await apiRequest('/api/loans', { token: 't' })
    expect(sentHeaders()).not.toHaveProperty('X-Saving-Id')
  })

  it('sends nothing in demo mode', async () => {
    store['natillera.demo.role'] = 'Admin'
    setSavingPeriodId('p-1')
    await apiRequest('/api/loans', { token: 'demo' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('classifies unscoped paths', () => {
    expect(isPeriodScopedPath('/api/loans')).toBe(true)
    expect(isPeriodScopedPath('/api/auth/login')).toBe(false)
    expect(isPeriodScopedPath('/api/saving-periods')).toBe(false)
  })
})
