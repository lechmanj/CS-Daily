/** Types the renderer's `window.csDaily` global. */
import type { CsDailyApi } from '@shared/ipc'

declare global {
  interface Window {
    csDaily: CsDailyApi
  }
}

export {}
