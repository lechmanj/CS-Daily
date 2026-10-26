import { describe, expect, it } from 'vitest'
import { expectedEntryFile, validateEntrySet, type LoadedEntry } from './content-validation'
import { makeEntry } from './entry.fixture'

const loaded = (id: string, related: string[] = [], file = expectedEntryFile(id)): LoadedEntry => ({
  file,
  entry: makeEntry({ id, related })
})

describe('validateEntrySet', () => {
  it('passes a consistent set', () => {
    expect(validateEntrySet([loaded('a', ['b']), loaded('b', ['a'])])).toEqual([])
  })

  it('reports related ids that match no entry', () => {
    const issues = validateEntrySet([loaded('a', ['ghost'])])
    expect(issues).toEqual([
      { file: 'entries/a.json', message: 'related id "ghost" does not match any entry' }
    ])
  })

  it('reports duplicate ids', () => {
    const issues = validateEntrySet([loaded('a'), loaded('a', [], 'entries/a-copy.json')])
    expect(issues.some((i) => i.message.includes('duplicate id "a"'))).toBe(true)
  })

  it('reports file names that do not match the id', () => {
    const issues = validateEntrySet([loaded('a', [], 'entries/wrong.json')])
    expect(issues[0]?.message).toContain('expected entries/a.json')
  })

  it('accepts an empty set', () => {
    expect(validateEntrySet([])).toEqual([])
  })
})
