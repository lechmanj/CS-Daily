/**
 * Registers IPC handlers. Every channel is allow-listed in `shared/ipc.ts`.
 * Handlers must validate their inputs; current channels take none.
 */
import { app, ipcMain, type BrowserWindow } from 'electron'
import { IpcChannel, normalizePlatform, type AppInfo } from '@shared/ipc'

/**
 * Wires up IPC handlers for the given widget window.
 * @param getWindow - Lazily returns the widget window (it may be recreated).
 */
export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IpcChannel.GetAppInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: normalizePlatform(process.platform)
  }))

  ipcMain.handle(IpcChannel.HideWindow, () => {
    getWindow()?.hide()
  })
}
