/**
 * Cross-entry validation: rules that cannot be checked by looking at a single
 * entry in isolation. Pure and free of I/O so it is trivial to test.
 */
import type { Entry } from './entry-schema'

/** One problem found in the content, tied to the file it came from. */
export interface ContentIssue {
  /** File name relative to the content directory, e.g. `entries/binary-search.json`. */
  readonly file: string
  readonly message: string
}

/** An entry together with the file it was loaded from. */
export interface LoadedEntry {
  readonly file: string
  readonly entry: Entry
}

/** The file name an entry must be stored under, derived from its id. */
export function expectedEntryFile(id: string): string {
  return `entries/${id}.json`
}

/**
 * Checks ids are unique, match their file names, and that every `related` id
 * refers to an entry in the set.
 * @param loaded - Entries that already passed the single-entry schema.
 */
export function validateEntrySet(loaded: readonly LoadedEntry[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const firstFileById = new Map<string, string>()

  for (const { file, entry } of loaded) {
    const first = firstFileById.get(entry.id)
    if (first) {
      issues.push({ file, message: `duplicate id "${entry.id}" (also used by ${first})` })
    } else {
      firstFileById.set(entry.id, file)
    }

    if (file !== expectedEntryFile(entry.id)) {
      issues.push({
        file,
        message: `file name must match the id: expected ${expectedEntryFile(entry.id)}`
      })
    }
  }

  for (const { file, entry } of loaded) {
    for (const relatedId of entry.related) {
      if (!firstFileById.has(relatedId)) {
        issues.push({ file, message: `related id "${relatedId}" does not match any entry` })
      }
    }
  }

  return issues
}
