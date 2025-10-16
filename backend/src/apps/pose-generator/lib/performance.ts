export class PerformanceTracker {
  private timers: Map<string, number> = new Map()

  start(operationId: string): void {
    this.timers.set(operationId, Date.now())
  }

  end(operationId: string): number {
    const startTime = this.timers.get(operationId)
    if (!startTime) {
      console.warn(`[Performance] No start time for operation: ${operationId}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(operationId)

    console.log(`[Performance] ${operationId}: ${duration}ms`)
    return duration
  }

  measure<T>(operationId: string, fn: () => Promise<T>): Promise<T> {
    this.start(operationId)
    return fn().finally(() => this.end(operationId))
  }
}

export const performanceTracker = new PerformanceTracker()
