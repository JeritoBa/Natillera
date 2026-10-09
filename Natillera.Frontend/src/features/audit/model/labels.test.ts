import { describe, expect, it } from 'vitest'
import { actionBackground, actionColor, actionLabel, actions, entityBackground, entityColor, entityLabel, entityTypes } from '@/features/audit/model/labels'

const hex = /^#[0-9a-f]{6}$/i

describe('audit labels', () => {
  it('derives entityTypes and actions from the label maps', () => {
    expect(entityTypes).toEqual(Object.keys(entityLabel))
    expect(actions).toEqual(['Create', 'Update', 'Delete'])
  })

  it('every entity type has label, color and background', () => {
    for (const key of entityTypes) {
      expect(entityLabel[key]).not.toBe('')
      expect(entityColor[key]).toMatch(hex)
      expect(entityBackground[key]).toMatch(hex)
    }
  })

  it('every action has label, color and background', () => {
    for (const key of actions) {
      expect(actionLabel[key]).not.toBe('')
      expect(actionColor[key]).toMatch(hex)
      expect(actionBackground[key]).toMatch(hex)
    }
  })
})
