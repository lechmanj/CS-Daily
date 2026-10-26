import { describe, expect, it } from 'vitest'
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  CODE_LANGUAGE_IDS,
  CODE_LANGUAGE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS
} from './taxonomy'

describe('taxonomy', () => {
  it('has a label for every id and no extras', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CATEGORY_IDS].sort())
    expect(Object.keys(DIFFICULTY_LABELS).sort()).toEqual([...DIFFICULTIES].sort())
    expect(Object.keys(CODE_LANGUAGE_LABELS).sort()).toEqual([...CODE_LANGUAGE_IDS].sort())
  })

  it('has unique ids', () => {
    for (const ids of [CATEGORY_IDS, DIFFICULTIES, CODE_LANGUAGE_IDS]) {
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('offers the ten categories and seven languages from the spec', () => {
    expect(CATEGORY_IDS).toHaveLength(10)
    expect(CODE_LANGUAGE_IDS).toHaveLength(7)
  })
})
