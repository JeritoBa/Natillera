import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/apiError'
import { isPendingObligationsError } from '@/features/members/model/memberStatus'

// MEM-04 / UI-10
describe('isPendingObligationsError', () => {
  it('detects the pending-obligations rejection', () => {
    expect(isPendingObligationsError(new ApiError(400, 'Member cannot be deactivated while they have pending monthly payments.'))).toBe(true)
  })
  it('ignores other 400 messages', () => {
    expect(isPendingObligationsError(new ApiError(400, 'Member not found.'))).toBe(false)
  })
  it('ignores other statuses with the same message', () => {
    expect(isPendingObligationsError(new ApiError(500, 'Member cannot be deactivated'))).toBe(false)
  })
  it('ignores non-ApiError values', () => {
    expect(isPendingObligationsError(new Error('Member cannot be deactivated'))).toBe(false)
    expect(isPendingObligationsError(new TypeError('Failed to fetch'))).toBe(false)
    expect(isPendingObligationsError(null)).toBe(false)
  })
})
