import { useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getFriendlyApiError } from '@/shared/api/apiError'

export function useAuthForm(onSuccess: () => void) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

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
    setEmail,
    setPassword,
    setShowPassword,
    submit,
  }
}
