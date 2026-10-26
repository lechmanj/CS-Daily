/**
 * Regenerates content/entry.schema.json from the Zod schema.
 * Run with `npm run generate:schema` after changing src/shared/entry-schema.ts.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serializeEntryJsonSchema } from '../src/shared/entry-json-schema'

const target = join(import.meta.dirname, '..', 'content', 'entry.schema.json')
await writeFile(target, serializeEntryJsonSchema(), 'utf8')
console.log(`Wrote ${target}`)
