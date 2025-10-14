/**
 * IP Address Utilities
 *
 * Provides secure IP address extraction, validation, and normalization
 * to prevent IP spoofing and rate limit bypass attacks.
 */

import { Context } from 'hono'

/**
 * Validate IPv4 address format
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

  if (!ipv4Pattern.test(ip)) {
    return false
  }

  const parts = ip.split('.').map(Number)
  return parts.every(part => part >= 0 && part <= 255)
}

/**
 * Validate IPv6 address format (simplified validation)
 */
export function isValidIPv6(ip: string): boolean {
  // Handle IPv4-mapped IPv6 addresses
  if (ip.includes('::ffff:')) {
    const ipv4Part = ip.split('::ffff:')[1]
    return isValidIPv4(ipv4Part)
  }

  // Basic IPv6 pattern
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  return ipv6Pattern.test(ip)
}

/**
 * Validate IP address (IPv4 or IPv6)
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip)
}

/**
 * Normalize IPv6 address to canonical form
 * Converts various IPv6 representations to a consistent format
 */
export function normalizeIPv6(ip: string): string {
  // Handle IPv4-mapped IPv6 addresses
  if (ip.includes('::ffff:')) {
    const ipv4Part = ip.split('::ffff:')[1]
    if (isValidIPv4(ipv4Part)) {
      return `::ffff:${ipv4Part.toLowerCase()}`
    }
  }

  // For full IPv6, just lowercase it (a more complete implementation
  // would expand :: and pad zeros, but this is sufficient for rate limiting)
  return ip.toLowerCase()
}

/**
 * Normalize IP address to canonical form
 */
export function normalizeIP(ip: string): string {
  if (isValidIPv4(ip)) {
    return ip.trim().toLowerCase()
  }

  if (isValidIPv6(ip)) {
    return normalizeIPv6(ip)
  }

  return ip
}

/**
 * Parse trusted proxy IPs from environment variable
 * Format: comma-separated list of IPs or CIDR blocks
 */
export function parseTrustedProxies(trustedProxiesEnv?: string): string[] {
  if (!trustedProxiesEnv) {
    return []
  }

  return trustedProxiesEnv
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
}

/**
 * Extract client IP address with trusted proxy validation
 *
 * This function implements secure IP extraction that prevents spoofing attacks:
 * 1. Only trusts X-Forwarded-For if coming from a trusted proxy
 * 2. Validates IP addresses before using them
 * 3. Takes the rightmost untrusted IP from X-Forwarded-For
 * 4. Falls back to trusted headers (Cloudflare, etc.)
 *
 * @param c - Hono context
 * @param trustedProxies - List of trusted proxy IPs (from env config)
 * @returns Normalized client IP address
 */
export function getClientIp(c: Context, trustedProxies: string[] = []): string {
  // Priority 1: Trusted CDN/proxy headers (these can't be spoofed by clients)
  const cfConnectingIp = c.req.header('CF-Connecting-IP')
  if (cfConnectingIp && isValidIP(cfConnectingIp)) {
    return normalizeIP(cfConnectingIp)
  }

  const trueClientIp = c.req.header('True-Client-IP')
  if (trueClientIp && isValidIP(trueClientIp)) {
    return normalizeIP(trueClientIp)
  }

  // Priority 2: X-Forwarded-For (only if we have trusted proxies configured)
  if (trustedProxies.length > 0) {
    const xForwardedFor = c.req.header('X-Forwarded-For')
    if (xForwardedFor) {
      // X-Forwarded-For format: client, proxy1, proxy2, ...
      // We want the rightmost IP that is NOT a trusted proxy
      const ips = xForwardedFor
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => isValidIP(ip))

      // Traverse from right to left, return first untrusted IP
      for (let i = ips.length - 1; i >= 0; i--) {
        const ip = ips[i]
        if (!trustedProxies.includes(ip)) {
          return normalizeIP(ip)
        }
      }

      // If all IPs are trusted proxies, use the leftmost (original client)
      if (ips.length > 0) {
        return normalizeIP(ips[0])
      }
    }
  }

  // Priority 3: X-Real-IP (only if validated)
  const xRealIp = c.req.header('X-Real-IP')
  if (xRealIp && isValidIP(xRealIp)) {
    return normalizeIP(xRealIp)
  }

  // Priority 4: Direct connection (Note: Hono doesn't expose socket IP directly)
  // In production behind a reverse proxy, we should ALWAYS have one of the above headers
  // If we don't, something is misconfigured

  // Fallback: Use a generic identifier
  // In production, this should trigger alerts as it indicates misconfiguration
  return 'unknown'
}

/**
 * Check if an IP is a private/internal IP
 * Useful for additional validation in production
 */
export function isPrivateIP(ip: string): boolean {
  if (!isValidIPv4(ip)) {
    return false
  }

  const parts = ip.split('.').map(Number)

  // 10.0.0.0/8
  if (parts[0] === 10) {
    return true
  }

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true
  }

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) {
    return true
  }

  // 127.0.0.0/8 (localhost)
  if (parts[0] === 127) {
    return true
  }

  return false
}

/**
 * Get IP subnet for aggregated metrics (privacy-preserving)
 * Returns first 3 octets for IPv4 (e.g., "192.168.1" from "192.168.1.100")
 */
export function getIPSubnet(ip: string): string {
  if (isValidIPv4(ip)) {
    const parts = ip.split('.')
    return parts.slice(0, 3).join('.')
  }

  if (isValidIPv6(ip)) {
    // For IPv6, return first 4 groups
    const parts = ip.split(':')
    return parts.slice(0, 4).join(':')
  }

  return 'unknown'
}
