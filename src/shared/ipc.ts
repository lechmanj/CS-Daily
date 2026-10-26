/**
 * IPC contract shared by the main process, the preload script and the renderer.
 * Keeping channel names and payload types in one file means a typo is a compile
 * error rather than a silent runtime failure.
 */

/** Allow-listed IPC channel names. The preload exposes nothing else. */
export const IpcChannel = {
  GetAppInfo: 'app:get-info',
  HideWindow: 'window:hide'
} as const

/** Basic, non-sensitive information about the running app. */
export interface AppInfo {
  readonly name: string
  readonly version: string
  readonly platform: 'darwin' | 'win32' | 'other'
}

/** The typed API the preload script exposes on `window.csDaily`. */
export interface CsDailyApi {
  getAppInfo(): Promise<AppInfo>
  hideWindow(): Promise<void>
}

/**
 * Narrows `process.platform` to the platforms the app supports.
 * @param platform - Value of `process.platform`.
 */
export function normalizePlatform(platform: string): AppInfo['platform'] {
  if (platform === 'darwin' || platform === 'win32') return platform
  return 'other'
}
