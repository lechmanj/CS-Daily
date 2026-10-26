/**
 * Validates everything under content/: every entry against the Zod schema,
 * referenced diagram files, related ids, file names, and that the published
 * JSON Schema is up to date. Exits non-zero on any problem so CI can gate on it.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serializeEntryJsonSchema } from '../src/shared/entry-json-schema'
import { loadContent } from '../src/main/content/loader'

const contentDir = join(import.meta.dirname, '..', 'content')
const schemaFile = join(contentDir, 'entry.schema.json')

const { entries, diagrams, issues } = await loadContent(contentDir)
const problems = issues.map(({ file, message }) => `${file}: ${message}`)

const onDisk = await readFile(schemaFile, 'utf8').catch(() => null)
if (onDisk !== serializeEntryJsonSchema()) {
  problems.push(
    'entry.schema.json: missing or out of date with the Zod schema; run `npm run generate:schema`'
  )
}

if (problems.length > 0) {
  console.error(`Content validation failed (${problems.length} problem(s)):\n`)
  for (const problem of problems) console.error(`  ✖ ${problem}`)
  process.exit(1)
}

console.log(`✔ ${entries.length} entries and ${diagrams.size} diagrams are valid`)
