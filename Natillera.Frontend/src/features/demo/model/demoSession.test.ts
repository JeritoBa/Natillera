import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDemoRole, DEMO_ROLE_KEY, readDemoRole, writeDemoRole } from '@/features/demo/model/demoSession'

function stubSessionStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
  })
  return store
}

afterEach(() => vi.unstubAllGlobals())

describe('demo session', () => {
  it('DEMO-01: there is no demo role without sessionStorage', () => {
    expect(readDemoRole()).toBeNull()
  })

  it('DEMO-01: the chosen role round-trips and can be cleared', () => {
    stubSessionStorage()
    writeDemoRole('Member')
    expect(readDemoRole()).toBe('Member')
    writeDemoRole('Admin')
    expect(readDemoRole()).toBe('Admin')
    clearDemoRole()
    expect(readDemoRole()).toBeNull()
  })

  it('DEMO-05: an invalid stored role is rejected and removed', () => {
    const store = stubSessionStorage({ [DEMO_ROLE_KEY]: 'Root' })
    expect(readDemoRole()).toBeNull()
    expect(store.has(DEMO_ROLE_KEY)).toBe(false)
  })
})
