import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeEntry } from '../../shared/entry.fixture'
import type { Entry } from '../../shared/entry-schema'
import { loadContent } from './loader'

const SAFE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect/></svg>'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cs-daily-content-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function put(relativePath: string, contents: string): Promise<void> {
  const target = join(dir, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, contents, 'utf8')
}

const putEntry = (entry: Entry, file = `entries/${entry.id}.json`) =>
  put(file, JSON.stringify(entry))

const svgVisual = (name: string) =>
  ({ type: 'svg', path: `diagrams/${name}.svg`, alt: 'A diagram' }) as const

describe('loadContent', () => {
  it('loads valid entries sorted by file name, plus their diagrams', async () => {
    await putEntry(makeEntry({ id: 'beta', visual: svgVisual('beta') }))
    await putEntry(makeEntry({ id: 'alpha' }))
    await put('diagrams/beta.svg', SAFE_SVG)

    const { entries, diagrams, issues } = await loadContent(dir)

    expect(issues).toEqual([])
    expect(entries.map((e) => e.id)).toEqual(['alpha', 'beta'])
    expect(diagrams.get('diagrams/beta.svg')).toBe(SAFE_SVG)
  })

  it('reports a missing entries directory instead of throwing', async () => {
    const { entries, issues } = await loadContent(dir)
    expect(entries).toEqual([])
    expect(issues).toEqual([{ file: 'entries', message: 'entries directory not found' }])
  })

  it('reports invalid JSON and keeps loading the other files', async () => {
    await put('entries/broken.json', '{ not json')
    await putEntry(makeEntry({ id: 'fine' }))

    const { entries, issues } = await loadContent(dir)

    expect(entries.map((e) => e.id)).toEqual(['fine'])
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ file: 'entries/broken.json' })
    expect(issues[0]?.message).toMatch(/invalid JSON/)
  })

  it('reports schema violations with the file and field path', async () => {
    await put(
      'entries/bad.json',
      JSON.stringify({ ...makeEntry({ id: 'bad' }), difficulty: 'expert' })
    )

    const { entries, issues } = await loadContent(dir)

    expect(entries).toEqual([])
    expect(
      issues.some((i) => i.file === 'entries/bad.json' && i.message.startsWith('difficulty'))
    ).toBe(true)
  })

  it('reports a referenced diagram that does not exist', async () => {
    await putEntry(makeEntry({ id: 'lonely', visual: svgVisual('missing') }))

    const { issues } = await loadContent(dir)

    expect(issues).toEqual([
      { file: 'entries/lonely.json', message: 'diagram file not found: diagrams/missing.svg' }
    ])
  })

  it('rejects unsafe SVG and does not expose its markup', async () => {
    await putEntry(makeEntry({ id: 'evil', visual: svgVisual('evil') }))
    await put('diagrams/evil.svg', '<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>')

    const { diagrams, issues } = await loadContent(dir)

    expect(diagrams.size).toBe(0)
    expect(issues[0]?.message).toMatch(/unsafe content: .*script/)
  })

  it('rejects SVG without a viewBox and files that are not SVG', async () => {
    await putEntry(makeEntry({ id: 'noview', visual: svgVisual('noview') }))
    await putEntry(makeEntry({ id: 'notsvg', visual: svgVisual('notsvg') }))
    await put('diagrams/noview.svg', '<svg><rect/></svg>')
    await put('diagrams/notsvg.svg', '<html></html>')

    const { issues } = await loadContent(dir)
    const messages = issues.map((i) => i.message).join('\n')

    expect(messages).toMatch(/missing a viewBox/)
    expect(messages).toMatch(/not an SVG document/)
  })

  it('reports cross-entry problems and keeps only the first duplicate id', async () => {
    await putEntry(makeEntry({ id: 'dup', related: ['ghost'] }), 'entries/dup.json')
    await putEntry(makeEntry({ id: 'dup' }), 'entries/dup-2.json')

    const { entries, issues } = await loadContent(dir)
    const messages = issues.map((i) => i.message).join('\n')

    expect(entries).toHaveLength(1)
    expect(messages).toMatch(/duplicate id "dup"/)
    expect(messages).toMatch(/related id "ghost"/)
  })

  it('ignores non-JSON files such as .DS_Store', async () => {
    await put('entries/.DS_Store', 'junk')
    await putEntry(makeEntry({ id: 'fine' }))

    const { entries, issues } = await loadContent(dir)

    expect(issues).toEqual([])
    expect(entries).toHaveLength(1)
  })
})
