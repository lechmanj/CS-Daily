/**
 * Loads and validates the bundled content directory (entries + diagrams).
 * Contains no Electron imports so the same code backs the app, the
 * `validate:content` script and the tests.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  validateEntrySet,
  type ContentIssue,
  type LoadedEntry
} from '../../shared/content-validation'
import { parseEntry, type Entry } from '../../shared/entry-schema'
import { findUnsafeSvgFeatures, looksLikeSvg } from '../../shared/svg-safety'

/** Everything read from a content directory. */
export interface LoadedContent {
  /** Entries that passed schema validation, sorted by file name. Duplicate ids keep the first. */
  readonly entries: Entry[]
  /** SVG markup of bundled diagrams, keyed by the entry's `visual.path`. */
  readonly diagrams: ReadonlyMap<string, string>
  /** Every problem found; an empty list means the content is fully valid. */
  readonly issues: ContentIssue[]
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

/** Reads, parses and schema-validates every `entries/*.json` file. */
async function loadEntries(contentDir: string, issues: ContentIssue[]): Promise<LoadedEntry[]> {
  let names: string[]
  try {
    names = (await readdir(join(contentDir, 'entries'))).filter((n) => n.endsWith('.json')).sort()
  } catch (error) {
    if (isMissingFile(error)) {
      issues.push({ file: 'entries', message: 'entries directory not found' })
      return []
    }
    throw error
  }

  const loaded: LoadedEntry[] = []
  for (const name of names) {
    const file = `entries/${name}`
    let json: unknown
    try {
      json = JSON.parse(await readFile(join(contentDir, file), 'utf8'))
    } catch (error) {
      const reason = error instanceof SyntaxError ? error.message : 'could not be read'
      issues.push({ file, message: `invalid JSON: ${reason}` })
      continue
    }

    const result = parseEntry(json)
    if (result.success) loaded.push({ file, entry: result.entry })
    else for (const message of result.issues) issues.push({ file, message })
  }
  return loaded
}

/** Reads every referenced bundled SVG and reports missing or unsafe files. */
async function loadDiagrams(
  contentDir: string,
  loaded: readonly LoadedEntry[],
  issues: ContentIssue[]
): Promise<Map<string, string>> {
  const diagrams = new Map<string, string>()

  for (const { file, entry } of loaded) {
    if (entry.visual?.type !== 'svg') continue
    const path = entry.visual.path
    if (diagrams.has(path)) continue

    let svg: string
    try {
      svg = await readFile(join(contentDir, path), 'utf8')
    } catch (error) {
      if (!isMissingFile(error)) throw error
      issues.push({ file, message: `diagram file not found: ${path}` })
      continue
    }

    if (!looksLikeSvg(svg)) {
      issues.push({ file: path, message: 'is not an SVG document (no <svg> root element)' })
      continue
    }
    if (!/viewBox\s*=/.test(svg)) {
      issues.push({ file: path, message: 'is missing a viewBox, so it cannot scale' })
    }
    const unsafe = findUnsafeSvgFeatures(svg)
    if (unsafe.length > 0) {
      issues.push({ file: path, message: `contains unsafe content: ${unsafe.join(', ')}` })
      continue
    }
    diagrams.set(path, svg)
  }
  return diagrams
}

/**
 * Loads the content directory and validates it end to end.
 * @param contentDir - Directory containing `entries/` and `diagrams/`.
 */
export async function loadContent(contentDir: string): Promise<LoadedContent> {
  const issues: ContentIssue[] = []
  const loaded = await loadEntries(contentDir, issues)
  issues.push(...validateEntrySet(loaded))

  // Keep the first entry for a duplicated id so the app never shows two with one id.
  const seen = new Set<string>()
  const unique = loaded.filter(({ entry }) => !seen.has(entry.id) && seen.add(entry.id))

  const diagrams = await loadDiagrams(contentDir, unique, issues)
  return { entries: unique.map(({ entry }) => entry), diagrams, issues }
}
