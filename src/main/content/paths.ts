/**
 * Locates the bundled content directory. Electron-specific, so it is kept out
 * of `loader.ts`. Packaged builds copy `content/` into the app's resources
 * (configured in Phase 8).
 */
import { join } from 'node:path'
import { app } from 'electron'

/** Absolute path of the directory holding `entries/` and `diagrams/`. */
export function getContentDir(): string {
  return app.isPackaged ? join(process.resourcesPath, 'content') : join(app.getAppPath(), 'content')
}
