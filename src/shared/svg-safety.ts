/**
 * A conservative lint for SVG markup. It flags features that could run code or
 * load remote resources. It is used to vet bundled diagrams; the sanitizer for
 * AI-generated SVG (Phase 6) is a separate, stricter piece of code.
 */

interface UnsafePattern {
  readonly label: string
  readonly pattern: RegExp
}

const UNSAFE_PATTERNS: readonly UnsafePattern[] = [
  { label: '<script> element', pattern: /<\s*script\b/i },
  { label: '<foreignObject> element', pattern: /<\s*foreignObject\b/i },
  { label: 'embedded <iframe>, <object> or <embed>', pattern: /<\s*(iframe|object|embed)\b/i },
  { label: 'event-handler attribute (on*=)', pattern: /\son[a-z]+\s*=/i },
  { label: 'javascript: URL', pattern: /javascript\s*:/i },
  { label: 'external href (only "#id" references are allowed)', pattern: /href\s*=\s*["'](?!#)/i },
  { label: 'external url() reference', pattern: /url\(\s*["']?(?!#)/i },
  { label: '@import rule', pattern: /@import\b/i },
  { label: 'DOCTYPE or ENTITY declaration', pattern: /<!\s*(DOCTYPE|ENTITY)\b/i }
]

/**
 * Lists the unsafe features found in an SVG string.
 * @param svg - Raw SVG markup.
 * @returns Human-readable descriptions; empty when nothing was flagged.
 */
export function findUnsafeSvgFeatures(svg: string): string[] {
  return UNSAFE_PATTERNS.filter(({ pattern }) => pattern.test(svg)).map(({ label }) => label)
}

/** Returns true if the markup starts with an `<svg>` root (ignoring an XML prolog or comments). */
export function looksLikeSvg(svg: string): boolean {
  const withoutProlog = svg
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[^>]*\?>/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trimStart()
  return /^<svg\b/i.test(withoutProlog)
}
