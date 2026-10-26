# CS Daily

A small desktop widget for macOS and Windows that shows one computer science concept per day:
a definition, an explanation, code examples in several languages and a diagram. It works fully
offline with bundled content.

> **Status:** Phase 1 (foundation). The widget currently shows an empty frameless window.
> See the roadmap in the build prompt for upcoming phases.

## Development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # start the widget with hot reload
npm run lint       # ESLint
npm run typecheck  # TypeScript (strict)
npm test           # Vitest
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

MIT
