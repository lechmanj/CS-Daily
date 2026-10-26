/**
 * Creates the widget window with a locked-down security configuration.
 * Position/size persistence and desktop-level behaviour arrive in Phase 4.
 */
import { join } from 'node:path'
import { BrowserWindow, shell } from 'electron'
import { createLogger } from './logger'

const log = createLogger('window')

const DEFAULT_SIZE = { width: 360, height: 480 }
const MIN_SIZE = { width: 300, height: 360 }
const MAX_SIZE = { width: 520, height: 800 }

/** Only these URL schemes may be opened in the user's default browser. */
const EXTERNAL_SCHEMES = new Set(['https:', 'http:', 'mailto:'])

/** Returns true if `url` is safe to hand to the OS default handler. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    return EXTERNAL_SCHEMES.has(new URL(url).protocol)
  } catch {
    return false
  }
}

/** Builds the frameless widget window and loads the renderer. */
export function createWidgetWindow(): BrowserWindow {
  const win = new BrowserWindow({
    ...DEFAULT_SIZE,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    maxWidth: MAX_SIZE.width,
    maxHeight: MAX_SIZE.height,
    show: false,
    frame: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    // Not transparent: Windows cannot resize transparent windows. Revisited in Phase 4.
    backgroundColor: '#f7f7f5',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  // Show only once the first frame is painted to avoid a white flash.
  win.once('ready-to-show', () => win.show())

  // The renderer is a single page: block every navigation and popup.
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url)
    } else {
      log.warn('Blocked window open with disallowed URL scheme')
    }
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) void win.loadURL(devUrl)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))

  return win
}
