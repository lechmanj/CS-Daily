/**
 * Test helper: builds a valid bundled entry that individual tests can tweak.
 * Not imported by application code.
 */
import type { Entry } from './entry-schema'

/**
 * Returns a valid entry with the given fields overridden.
 * @param overrides - Fields to replace on the base entry.
 */
export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'sample-entry',
    title: 'Sample Entry',
    category: 'algorithms',
    difficulty: 'beginner',
    definition: 'A short definition.',
    explanation: 'A longer explanation.',
    whyItMatters: 'It matters.',
    examples: [
      { language: 'python', title: 'Basic', code: 'print(1)\n', explanation: 'Prints one.' }
    ],
    related: [],
    tags: ['sample'],
    source: 'bundled',
    ...overrides
  }
}
