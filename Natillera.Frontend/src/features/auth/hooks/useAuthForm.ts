import { useState, type FormEvent } from 'react'

export function useAuthForm(onSuccess: () => void) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onSuccess()
    }, 1000)
  }

  return {
    email,
    password,
    showPassword,
    loading,
    setEmail,
    setPassword,
    setShowPassword,
    submit,
  }
}
