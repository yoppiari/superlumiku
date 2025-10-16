export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  metadata?: Record<string, any>
  error?: string
}

export class Logger {
  private component: string

  constructor(component: string) {
    this.component = component
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      metadata,
      error: error?.message,
    }

    // Format for console
    const prefix = `[${entry.timestamp}] [${level}] [${this.component}]`
    const msg = `${prefix} ${message}`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(msg, metadata || '')
        break
      case LogLevel.INFO:
        console.log(msg, metadata || '')
        break
      case LogLevel.WARN:
        console.warn(msg, metadata || '', error || '')
        break
      case LogLevel.ERROR:
        console.error(msg, metadata || '', error || '')
        break
    }

    // Future: Send to external logging service (Datadog, Sentry, etc.)
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata)
  }

  warn(message: string, metadata?: Record<string, any>, error?: Error) {
    this.log(LogLevel.WARN, message, metadata, error)
  }

  error(message: string, metadata?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, metadata, error)
  }
}

// Create loggers for different components
export const workerLogger = new Logger('Worker')
export const storageLogger = new Logger('Storage')
export const fluxLogger = new Logger('FLUX')
export const metricsLogger = new Logger('Metrics')
