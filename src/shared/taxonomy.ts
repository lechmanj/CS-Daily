/**
 * Single source of truth for the closed vocabularies used by entries and
 * settings: categories, difficulty levels and code-example languages.
 * Add a value here and the schema, JSON Schema and UI pick it up.
 */

/** Machine ids of the user-selectable categories. */
export const CATEGORY_IDS = [
  'data-structures',
  'algorithms',
  'complexity-and-theory',
  'operating-systems',
  'networking',
  'databases',
  'security',
  'programming-languages',
  'software-engineering',
  'distributed-systems'
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

/** Human-readable category names. Keyed by id so a missing label is a compile error. */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'data-structures': 'Data structures',
  algorithms: 'Algorithms',
  'complexity-and-theory': 'Complexity and theory',
  'operating-systems': 'Operating systems',
  networking: 'Networking',
  databases: 'Databases',
  security: 'Security',
  'programming-languages': 'Programming languages and paradigms',
  'software-engineering': 'Software engineering',
  'distributed-systems': 'Distributed systems'
}

/** Difficulty levels, ordered from easiest to hardest. */
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
}

/** Languages supported for code examples in v1. */
export const CODE_LANGUAGE_IDS = [
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'go',
  'rust'
] as const

export type CodeLanguageId = (typeof CODE_LANGUAGE_IDS)[number]

export const CODE_LANGUAGE_LABELS: Record<CodeLanguageId, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  cpp: 'C++',
  go: 'Go',
  rust: 'Rust'
}
