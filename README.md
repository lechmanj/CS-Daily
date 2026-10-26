# CS Daily

A small desktop widget for macOS and Windows that shows one computer science concept per day:
a definition, an explanation, code examples in several languages and a diagram. It works fully
offline with bundled content.

> **Status:** Phase 2 (content system). The widget still shows an empty frameless window;
> the content pipeline behind it is in place.
> See the roadmap in the build prompt for upcoming phases.

## Development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # start the widget with hot reload
npm run lint       # ESLint
npm run typecheck  # TypeScript (strict)
npm test           # Vitest
npm run validate:content   # check every entry, diagram and the JSON Schema
npm run generate:schema    # regenerate content/entry.schema.json from the Zod schema
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Content

Entries are plain JSON files in `content/entries/` (one per concept, named after its `id`) and
diagrams are SVG files in `content/diagrams/`. They are separate from the app code, so adding a
concept never requires touching `src/`.

- The schema lives in `src/shared/entry-schema.ts` (Zod) and is exported to
  `content/entry.schema.json`. Add `"$schema": "../entry.schema.json"` to an entry for editor
  validation and autocomplete.
- `npm run validate:content` checks every entry against the schema, that referenced diagram files
  exist and are free of scripts and remote references, that `related` ids resolve, and that file
  names match ids.
- Diagrams should draw with `currentColor` and use `var(--diagram-accent, #3b5bdb)` (via a
  `style` attribute) for the accent, so they follow the light and dark themes.

## License

MIT
