/**
 * Integration tests over the real content/ directory, so a bad contribution
 * fails `npm test` as well as `npm run validate:content`.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadContent } from '../src/main/content/loader'
import { buildEntryJsonSchema, serializeEntryJsonSchema } from '../src/shared/entry-json-schema'
import { CATEGORY_IDS } from '../src/shared/taxonomy'

const contentDir = join(import.meta.dirname, '..', 'content')

describe('bundled content', () => {
  it('loads with no validation issues', async () => {
    const { entries, issues } = await loadContent(contentDir)
    expect(issues).toEqual([])
    expect(entries.length).toBeGreaterThanOrEqual(5)
  })

  it('has a diagram file for every bundled svg visual', async () => {
    const { entries, diagrams } = await loadContent(contentDir)
    const paths = entries.flatMap((e) => (e.visual?.type === 'svg' ? [e.visual.path] : []))
    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths) expect(diagrams.has(path)).toBe(true)
  })

  it('only contains bundled entries', async () => {
    const { entries } = await loadContent(contentDir)
    expect(entries.every((e) => e.source === 'bundled')).toBe(true)
  })
})

describe('entry.schema.json', () => {
  it('is up to date with the Zod schema (run `npm run generate:schema` if not)', async () => {
    const onDisk = await readFile(join(contentDir, 'entry.schema.json'), 'utf8')
    expect(onDisk).toBe(serializeEntryJsonSchema())
  })

  it('exposes the category list from the single source of truth', () => {
    const properties = buildEntryJsonSchema()['properties'] as Record<string, { enum?: string[] }>
    expect(properties['category']?.enum).toEqual([...CATEGORY_IDS])
  })
})
