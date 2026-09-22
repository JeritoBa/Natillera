export class ApiError extends Error {
  public readonly status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function getFriendlyApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'El correo o la contraseña no son correctos.'
    if (error.status === 403) return 'No tienes permisos para realizar esta acción.'
    if (error.status === 400) return error.message || 'Revisa los datos ingresados.'
    if (error.status >= 500) return 'Ocurrió un problema en el servidor. Intenta nuevamente.'
    return error.message || 'No pudimos completar la solicitud.'
  }

  if (error instanceof DOMException && error.name === 'AbortError') return 'La solicitud tardó demasiado. Intenta nuevamente.'
  if (error instanceof TypeError) return 'No pudimos conectar con el servidor. Intenta nuevamente.'
  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}
