import { describe, expect, it } from 'vitest'
import { ApiError, getFriendlyApiError } from '@/shared/api/apiError'

describe('ApiError', () => {
  it('keeps status and message', () => {
    const error = new ApiError(400, 'bad')
    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(400)
    expect(error.message).toBe('bad')
    expect(error.name).toBe('ApiError')
  })
})

describe('getFriendlyApiError', () => {
  it('401 inactive user', () => {
    expect(getFriendlyApiError(new ApiError(401, 'The user is inactive.'))).toBe('Tu cuenta está desactivada. Contacta al administrador.')
  })

  it('other 401 -> credentials message', () => {
    const expected = 'El correo o la contraseña no son correctos.'
    expect(getFriendlyApiError(new ApiError(401, 'Invalid credentials'))).toBe(expected)
    expect(getFriendlyApiError(new ApiError(401, ''))).toBe(expected)
  })

  it('403 -> permissions message', () => {
    expect(getFriendlyApiError(new ApiError(403, 'x'))).toBe('No tienes permisos para realizar esta acción.')
  })

  it('400 with message -> that message; without -> generic review text', () => {
    expect(getFriendlyApiError(new ApiError(400, 'Monto inválido'))).toBe('Monto inválido')
    expect(getFriendlyApiError(new ApiError(400, ''))).toBe('Revisa los datos ingresados.')
  })

  it('5xx -> server message', () => {
    const expected = 'Ocurrió un problema en el servidor. Intenta nuevamente.'
    expect(getFriendlyApiError(new ApiError(500, 'boom'))).toBe(expected)
    expect(getFriendlyApiError(new ApiError(503, ''))).toBe(expected)
  })

  it('other statuses -> message or fallback', () => {
    expect(getFriendlyApiError(new ApiError(404, 'No existe'))).toBe('No existe')
    expect(getFriendlyApiError(new ApiError(409, ''))).toBe('No pudimos completar la solicitud.')
  })

  it('AbortError -> timeout message', () => {
    expect(getFriendlyApiError(new DOMException('aborted', 'AbortError'))).toBe('La solicitud tardó demasiado. Intenta nuevamente.')
  })

  it('TypeError (network failure) -> connection message', () => {
    expect(getFriendlyApiError(new TypeError('Failed to fetch'))).toBe('No pudimos conectar con el servidor. Intenta nuevamente.')
  })

  it('unknown errors -> generic message', () => {
    const expected = 'Ocurrió un error inesperado. Intenta nuevamente.'
    expect(getFriendlyApiError(new Error('x'))).toBe(expected)
    expect(getFriendlyApiError('oops')).toBe(expected)
    expect(getFriendlyApiError(null)).toBe(expected)
  })
})
