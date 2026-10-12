import { ApiError } from '@/shared/api/apiError'

/** MEM-04: the backend rejects deactivating a member with open obligations. */
export function isPendingObligationsError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400 && error.message.startsWith('Member cannot be deactivated')
}
