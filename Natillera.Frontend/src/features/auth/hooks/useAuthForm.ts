import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SESSION_EXPIRED_NOTICE_KEY } from '@/features/auth/model/authTypes'
import { getFriendlyApiError } from '@/shared/api/apiError'

export function useAuthForm(onSuccess: () => void) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionNotice] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY) !== null
    } catch {
      return false
    }
  })
  const [showNotice, setShowNotice] = useState(sessionNotice)

  useEffect(() => {
    try {
      sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY)
    } catch {
      // Sin acceso a sessionStorage no hay marca que borrar.
    }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setShowNotice(false)

    const normalizedEmail = email.trim()
    if (!normalizedEmail) return setError('Ingresa tu correo.')
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError('Ingresa un correo válido.')
    if (!password) return setError('Ingresa tu contraseña.')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')

    try {
      await login(normalizedEmail, password)
      onSuccess()
    } catch (requestError) {
      setError(getFriendlyApiError(requestError))
    }
  }

  return {
    email,
    password,
    showPassword,
    loading: isLoading,
    error,
    sessionNotice: showNotice ? 'Tu sesión ya no es válida. Inicia sesión de nuevo.' : null,
    setEmail,
    setPassword,
    setShowPassword,
    submit,
  }
}
