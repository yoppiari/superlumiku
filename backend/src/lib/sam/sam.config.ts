/**
 * SAM Service Configuration
 */

export const SAM_CONFIG = {
  // SAM Service URL
  baseUrl: process.env.SAM_SERVICE_URL || 'http://localhost:5001',

  // Timeout for SAM requests (milliseconds)
  timeout: parseInt(process.env.SAM_TIMEOUT || '30000', 10),

  // Retry configuration
  retryAttempts: parseInt(process.env.SAM_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.SAM_RETRY_DELAY || '1000', 10),

  // Enabled/disabled flag
  enabled: process.env.SAM_ENABLED !== 'false',
}

export function isSAMEnabled(): boolean {
  return SAM_CONFIG.enabled
}
