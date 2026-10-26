import { describe, expect, it } from 'vitest'
import { EntrySchema, parseEntry } from './entry-schema'
import { makeEntry } from './entry.fixture'

/** Returns the issues for an entry, or an empty array if it is valid. */
function issuesFor(input: unknown): string[] {
  const result = parseEntry(input)
  return result.success ? [] : result.issues
}

const aiMeta = { provider: 'anthropic', model: 'some-model', createdAt: '2026-10-26T12:00:00Z' }

describe('EntrySchema basics', () => {
  it('accepts a valid entry', () => {
    expect(issuesFor(makeEntry())).toEqual([])
  })

  it('accepts the optional $schema editor hint', () => {
    expect(issuesFor({ ...makeEntry(), $schema: '../entry.schema.json' })).toEqual([])
  })

  it('rejects unknown keys (strict objects)', () => {
    expect(issuesFor({ ...makeEntry(), surprise: true }).join('\n')).toMatch(
      /surprise|Unrecognized/i
    )
  })

  it('trims surrounding whitespace in text fields', () => {
    const parsed = EntrySchema.parse(makeEntry({ title: '  Padded  ' }))
    expect(parsed.title).toBe('Padded')
  })

  it('reports the path of the offending field', () => {
    const entry = makeEntry()
    const bad = { ...entry, examples: [{ ...entry.examples[0], language: 'cobol' }] }
    expect(issuesFor(bad).some((i) => i.startsWith('examples.0.language'))).toBe(true)
  })

  it.each(['Binary Search', '-leading', 'trailing-', 'under_score', 'double--dash', ''])(
    'rejects the invalid id %j',
    (id) => {
      expect(issuesFor(makeEntry({ id })).length).toBeGreaterThan(0)
    }
  )

  it('rejects unknown categories and difficulties', () => {
    expect(issuesFor({ ...makeEntry(), category: 'cooking' }).length).toBeGreaterThan(0)
    expect(issuesFor({ ...makeEntry(), difficulty: 'expert' }).length).toBeGreaterThan(0)
  })

  it('requires at least one example', () => {
    expect(issuesFor(makeEntry({ examples: [] })).length).toBeGreaterThan(0)
  })

  it('rejects empty required text', () => {
    expect(issuesFor(makeEntry({ definition: '   ' })).length).toBeGreaterThan(0)
  })
})

describe('source and generation metadata', () => {
  it('requires generation metadata for ai-generated entries', () => {
    expect(issuesFor(makeEntry({ source: 'ai-generated' }))).toContain(
      'generation: is required when source is "ai-generated"'
    )
  })

  it('accepts ai-generated entries with provider, model and date', () => {
    expect(issuesFor(makeEntry({ source: 'ai-generated', generation: aiMeta }))).toEqual([])
  })

  it('rejects generation metadata on bundled entries', () => {
    expect(issuesFor(makeEntry({ generation: aiMeta }))).toContain(
      'generation: must be omitted when source is "bundled"'
    )
  })

  it('rejects a malformed creation date', () => {
    const generation = { ...aiMeta, createdAt: 'yesterday' }
    expect(issuesFor(makeEntry({ source: 'ai-generated', generation })).length).toBeGreaterThan(0)
  })
})

describe('visuals', () => {
  const alt = 'Diagram description'

  it('accepts a bundled svg path under diagrams/', () => {
    const visual = { type: 'svg', path: 'diagrams/sample-entry.svg', alt } as const
    expect(issuesFor(makeEntry({ visual }))).toEqual([])
  })

  it.each(['../secret.svg', 'diagrams/../secret.svg', '/etc/passwd', 'diagrams/a.png', 'a.svg'])(
    'rejects the svg path %j',
    (path) => {
      expect(
        issuesFor({ ...makeEntry(), visual: { type: 'svg', path, alt } }).length
      ).toBeGreaterThan(0)
    }
  )

  it('accepts mermaid for both bundled and ai-generated entries', () => {
    const visual = { type: 'mermaid', source: 'graph TD; A-->B', alt } as const
    expect(issuesFor(makeEntry({ visual }))).toEqual([])
    expect(issuesFor(makeEntry({ visual, source: 'ai-generated', generation: aiMeta }))).toEqual([])
  })

  it('only allows inline-svg on ai-generated entries', () => {
    const visual = { type: 'inline-svg', svg: '<svg viewBox="0 0 1 1"></svg>', alt } as const
    expect(issuesFor(makeEntry({ visual })).length).toBeGreaterThan(0)
    expect(issuesFor(makeEntry({ visual, source: 'ai-generated', generation: aiMeta }))).toEqual([])
  })

  it('only allows svg files on bundled entries', () => {
    const visual = { type: 'svg', path: 'diagrams/x.svg', alt } as const
    expect(
      issuesFor(makeEntry({ visual, source: 'ai-generated', generation: aiMeta })).length
    ).toBeGreaterThan(0)
  })

  it('requires alt text', () => {
    const visual = { type: 'mermaid', source: 'graph TD; A-->B' }
    expect(issuesFor({ ...makeEntry(), visual }).length).toBeGreaterThan(0)
  })
})

describe('lists', () => {
  it('rejects an entry that relates to itself', () => {
    expect(issuesFor(makeEntry({ related: ['sample-entry'] }))).toContain(
      'related: must not reference the entry itself'
    )
  })

  it('rejects duplicate related ids and duplicate tags', () => {
    expect(issuesFor(makeEntry({ related: ['a', 'a'] })).join()).toMatch(/duplicate id "a"/)
    expect(issuesFor(makeEntry({ tags: ['x', 'x'] })).join()).toMatch(/duplicate tag "x"/)
  })

  it('allows several examples in one language with different titles', () => {
    const base = makeEntry().examples[0]!
    const examples = [base, { ...base, title: 'Recursive' }]
    expect(issuesFor(makeEntry({ examples }))).toEqual([])
  })

  it('rejects two examples with the same language and title', () => {
    const base = makeEntry().examples[0]!
    expect(issuesFor(makeEntry({ examples: [base, base] })).join()).toMatch(/duplicate example/)
  })
})
