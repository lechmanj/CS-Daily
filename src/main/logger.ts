/**
 * Minimal logger wrapper. Centralising logging lets us later redact secrets or
 * write to a file in one place. Never pass API keys or other secrets to it.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

function write(level: Level, scope: string, message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] [${level}] [${scope}] ${message}`
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  if (meta === undefined) sink(line)
  else sink(line, meta)
}

/**
 * Creates a logger bound to a scope name.
 * @param scope - Short module name shown in each log line.
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: unknown) => write('debug', scope, message, meta),
    info: (message: string, meta?: unknown) => write('info', scope, message, meta),
    warn: (message: string, meta?: unknown) => write('warn', scope, message, meta),
    error: (message: string, meta?: unknown) => write('error', scope, message, meta)
  }
}
