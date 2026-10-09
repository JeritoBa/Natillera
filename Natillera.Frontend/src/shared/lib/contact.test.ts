import { describe, expect, it } from 'vitest'
import { WHATSAPP_URL } from '@/shared/lib/contact'

describe('WHATSAPP_URL', () => {
  it('points to the natillera WhatsApp number', () => {
    const url = new URL(WHATSAPP_URL)
    expect(url.origin).toBe('https://wa.me')
    expect(url.pathname).toBe('/573123326094')
  })

  it('carries the URL-encoded join message', () => {
    expect(WHATSAPP_URL).toContain('?text=Quiero%20unirme%20a%20la%20natillera')
    expect(new URL(WHATSAPP_URL).searchParams.get('text')).toBe('Quiero unirme a la natillera')
  })
})
