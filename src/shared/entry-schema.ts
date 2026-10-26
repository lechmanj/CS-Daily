/**
 * Zod schema for a CS Daily entry. This is the contract for bundled content,
 * AI-generated content and anything read back from local storage.
 *
 * Structural rules live in the object schemas (and are exported to JSON
 * Schema); rules that span several fields live in `superRefine`, which JSON
 * Schema cannot express. Cross-entry rules (unique ids, resolvable `related`
 * ids) live in `content-validation.ts`.
 */
import { z } from 'zod'
import { CATEGORY_IDS, CODE_LANGUAGE_IDS, DIFFICULTIES } from './taxonomy'

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DIAGRAM_PATH_PATTERN = /^diagrams\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/

/** Lowercase kebab-case identifier, also used as the entry's file name. */
export const EntryIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(ID_PATTERN, { error: 'must be lowercase kebab-case, e.g. "binary-search"' })

/** Non-empty, trimmed text with an upper length bound. */
const text = (max: number) => z.string().trim().min(1).max(max)

export const ComplexitySchema = z.strictObject({
  time: text(80),
  space: text(80)
})

export const CodeExampleSchema = z.strictObject({
  language: z.enum(CODE_LANGUAGE_IDS),
  title: text(80),
  code: z.string().min(1).max(8000),
  explanation: text(1000)
})

/**
 * A diagram. `svg` points at a bundled file under content/diagrams, `mermaid`
 * carries inline Mermaid source, and `inline-svg` carries sanitized SVG markup
 * produced by the AI layer.
 */
export const VisualSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('svg'),
    path: z.string().regex(DIAGRAM_PATH_PATTERN, {
      error: 'must look like "diagrams/<kebab-case-name>.svg"'
    }),
    alt: text(300)
  }),
  z.strictObject({
    type: z.literal('mermaid'),
    source: text(4000),
    alt: text(300)
  }),
  z.strictObject({
    type: z.literal('inline-svg'),
    svg: text(50_000),
    alt: text(300)
  })
])

/** Provenance recorded for AI-generated entries. */
export const GenerationMetaSchema = z.strictObject({
  provider: text(50),
  model: text(100),
  createdAt: z.iso.datetime()
})

export const EntrySourceSchema = z.enum(['bundled', 'ai-generated'])

/** Returns the values that appear more than once, for readable error messages. */
function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) dupes.add(value)
    seen.add(value)
  }
  return [...dupes]
}

export const EntrySchema = z
  .strictObject({
    /** Optional editor hint pointing at content/entry.schema.json. */
    $schema: z.string().optional(),
    id: EntryIdSchema,
    title: text(100),
    category: z.enum(CATEGORY_IDS),
    difficulty: z.enum(DIFFICULTIES),
    definition: text(400),
    explanation: text(6000),
    whyItMatters: text(1000),
    complexity: ComplexitySchema.optional(),
    examples: z.array(CodeExampleSchema).min(1).max(14),
    visual: VisualSchema.optional(),
    related: z.array(EntryIdSchema).max(10),
    tags: z.array(text(40)).max(10),
    source: EntrySourceSchema,
    generation: GenerationMetaSchema.optional()
  })
  .superRefine((entry, ctx) => {
    const fail = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })

    if (entry.source === 'ai-generated' && !entry.generation) {
      fail(['generation'], 'is required when source is "ai-generated"')
    }
    if (entry.source === 'bundled' && entry.generation) {
      fail(['generation'], 'must be omitted when source is "bundled"')
    }

    // Bundled SVG files only exist in the repo; AI output can only be inline.
    if (entry.visual?.type === 'svg' && entry.source !== 'bundled') {
      fail(['visual', 'type'], '"svg" files are only allowed for bundled entries')
    }
    if (entry.visual?.type === 'inline-svg' && entry.source !== 'ai-generated') {
      fail(['visual', 'type'], '"inline-svg" is only allowed for ai-generated entries')
    }

    if (entry.related.includes(entry.id)) {
      fail(['related'], 'must not reference the entry itself')
    }
    for (const dupe of duplicates(entry.related)) fail(['related'], `duplicate id "${dupe}"`)
    for (const dupe of duplicates(entry.tags)) fail(['tags'], `duplicate tag "${dupe}"`)

    const exampleKeys = entry.examples.map((e) => `${e.language}:${e.title}`)
    for (const dupe of duplicates(exampleKeys)) {
      fail(['examples'], `duplicate example (language:title) "${dupe}"`)
    }
  })

export type Entry = z.infer<typeof EntrySchema>
export type CodeExample = z.infer<typeof CodeExampleSchema>
export type Visual = z.infer<typeof VisualSchema>

/** Result of validating unknown input as an entry. */
export type ParseEntryResult =
  | { readonly success: true; readonly entry: Entry }
  | { readonly success: false; readonly issues: string[] }

/**
 * Formats Zod issues as `path: message` lines, e.g. `examples.0.language: ...`.
 * @param error - The error returned by a failed `safeParse`.
 */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

/**
 * Validates unknown data (parsed JSON, IPC input, AI output) as an entry.
 * @param input - Any value; nothing is assumed about its shape.
 */
export function parseEntry(input: unknown): ParseEntryResult {
  const result = EntrySchema.safeParse(input)
  if (result.success) return { success: true, entry: result.data }
  return { success: false, issues: formatIssues(result.error) }
}
