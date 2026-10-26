/**
 * Builds the JSON Schema published at content/entry.schema.json from the Zod
 * schema, so contributors get editor validation and autocomplete while the Zod
 * schema stays the single source of truth.
 */
import { z } from 'zod'
import { EntrySchema } from './entry-schema'

/** Returns the entry JSON Schema (draft-07) as a plain object. */
export function buildEntryJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(EntrySchema, { target: 'draft-7' })
  return {
    ...schema,
    title: 'CS Daily entry',
    description:
      'Structure of a CS Daily entry. Cross-field and cross-entry rules (unique ids, resolvable ' +
      '"related" ids, existing diagram files) are checked by `npm run validate:content`.'
  }
}

/** Serialises the schema exactly as it is written to disk (trailing newline included). */
export function serializeEntryJsonSchema(): string {
  return `${JSON.stringify(buildEntryJsonSchema(), null, 2)}\n`
}
