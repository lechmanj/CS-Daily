/**
 * Sandboxed preload script. Exposes a small, typed, allow-listed API on
 * `window.csDaily`. Nothing from Node or Electron leaks to the renderer.
 */
import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, type CsDailyApi } from '@shared/ipc'

const api: CsDailyApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.GetAppInfo),
  hideWindow: () => ipcRenderer.invoke(IpcChannel.HideWindow)
}

contextBridge.exposeInMainWorld('csDaily', api)
