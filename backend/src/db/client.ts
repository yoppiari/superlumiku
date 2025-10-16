import { PrismaClient } from '@prisma/client'

// Create a singleton instance of Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * P2 PERFORMANCE: Database Connection Pooling
 *
 * Configures Prisma with connection pooling for optimal performance:
 * - Development: connection_limit=10, pool_timeout=20s
 * - Production: connection_limit=50, pool_timeout=20s
 *
 * Add to DATABASE_URL:
 * postgresql://user:pass@host/db?connection_limit=50&pool_timeout=20
 *
 * Benefits:
 * - Reduces database connection overhead
 * - Prevents connection exhaustion under load
 * - Improves response times for concurrent requests
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Connection pool configuration via query string parameters
    // Example: postgresql://user:pass@host/db?connection_limit=50&pool_timeout=20
    //
    // Defaults if not in URL:
    // - connection_limit: 10 (default Prisma)
    // - pool_timeout: 10s (default Prisma)
    // - connect_timeout: 5s
    // - socket_timeout: 10s
  })

// Log connection pool configuration
if (isDevelopment || isProduction) {
  const dbUrl = process.env.DATABASE_URL || ''
  const hasConnectionLimit = dbUrl.includes('connection_limit=')
  const hasPoolTimeout = dbUrl.includes('pool_timeout=')

  console.log('[Database] Prisma client initialized')
  console.log(`[Database] Connection pooling: ${hasConnectionLimit ? 'CONFIGURED' : 'USING DEFAULTS (10 connections)'}`)

  if (!hasConnectionLimit && isProduction) {
    console.warn('[Database] WARNING: No connection_limit in DATABASE_URL. Add ?connection_limit=50&pool_timeout=20 for production')
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma