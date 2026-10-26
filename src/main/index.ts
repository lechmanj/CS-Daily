/**
 * Electron main-process entry point: single-instance lock, app lifecycle and
 * window creation.
 */
import { app, type BrowserWindow } from 'electron'
import { loadContent } from './content/loader'
import { getContentDir } from './content/paths'
import { registerIpcHandlers } from './ipc'
import { createLogger } from './logger'
import { createWidgetWindow } from './window'

const log = createLogger('main')
let widget: BrowserWindow | null = null

/** Brings the existing widget to the front, restoring it if minimised/hidden. */
function focusWidget(): void {
  if (!widget) return
  if (widget.isMinimized()) widget.restore()
  widget.show()
  widget.focus()
}

// A second launch must focus the running widget rather than open another one.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', focusWidget)

  void app.whenReady().then(() => {
    registerIpcHandlers(() => widget)
    widget = createWidgetWindow()
    widget.on('closed', () => {
      widget = null
    })
    log.info('Widget ready')

    // Phase 4 hands this to the renderer; for now, surface content problems early.
    void loadContent(getContentDir()).then(({ entries, issues }) => {
      log.info(`Loaded ${entries.length} bundled entries`)
      for (const { file, message } of issues) log.warn(`Content issue in ${file}: ${message}`)
    })

    // macOS: re-create the window when the Dock icon is clicked with none open.
    app.on('activate', () => {
      if (widget) focusWidget()
      else widget = createWidgetWindow()
    })
  })

  app.on('window-all-closed', () => {
    // The tray (Phase 4) keeps the app alive on macOS; for now quit everywhere.
    app.quit()
  })
}
