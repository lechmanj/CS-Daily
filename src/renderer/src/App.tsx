/**
 * Root component. Phase 1 renders only a draggable header and an empty body;
 * the real widget UI arrives in Phase 4.
 */
import { useEffect, useState } from 'react'
import type { AppInfo } from '@shared/ipc'

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    void window.csDaily.getAppInfo().then(setInfo)
  }, [])

  return (
    <div className="widget">
      <header className="widget__header">
        <h1 className="widget__title">CS Daily</h1>
        <button
          type="button"
          className="widget__close"
          aria-label="Hide widget"
          onClick={() => void window.csDaily.hideWindow()}
        >
          ×
        </button>
      </header>
      <main className="widget__body">
        <p className="widget__muted">
          {info ? `v${info.version} on ${info.platform}. ` : ''}Foundation is ready.
        </p>
      </main>
    </div>
  )
}
