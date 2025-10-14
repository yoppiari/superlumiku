/**
 * Rate Limit Endpoint Configurations
 *
 * Centralized rate limiting configuration for all critical endpoints.
 * Prevents abuse, resource exhaustion, and ensures fair usage.
 */

import { rateLimiter } from '../middleware/rate-limiter.middleware'

/**
 * Generation endpoint rate limiters
 * Prevents spam generation requests that could exhaust resources
 */

// Video Mixer - Generation
export const videoMixerGenerationLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 generation requests per minute
  keyPrefix: 'rl:video-mixer:generate',
  message: 'Too many video generation requests. Please wait before starting another generation.',
})

// Carousel Mix - Generation
export const carouselMixGenerationLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 generation requests per minute (lighter workload)
  keyPrefix: 'rl:carousel-mix:generate',
  message: 'Too many carousel generation requests. Please wait before starting another generation.',
})

// Avatar Creator - Upload
export const avatarUploadLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 uploads per minute
  keyPrefix: 'rl:avatar:upload',
  message: 'Too many avatar uploads. Please wait before uploading more.',
})

// Avatar Creator - AI Generation
export const avatarGenerationLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI generations per minute (expensive operation)
  keyPrefix: 'rl:avatar:generate',
  message: 'Too many avatar generation requests. Please wait before generating more avatars.',
})

/**
 * Admin endpoint rate limiters
 * Protects sensitive administrative functions
 */

// Admin - Seed Models
export const adminSeedModelsLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 seed operations per hour
  keyPrefix: 'rl:admin:seed',
  message: 'Too many seed requests. This is an administrative operation.',
})

// Admin - General Operations
export const adminOperationsLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 admin operations per minute
  keyPrefix: 'rl:admin:ops',
  message: 'Too many administrative requests. Please slow down.',
})

/**
 * File operation rate limiters
 * Prevents abuse of upload/download endpoints
 */

// File Upload - General
export const fileUploadLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 file uploads per minute
  keyPrefix: 'rl:file:upload',
  message: 'Too many file uploads. Please wait before uploading more files.',
})

// File Download - General
export const fileDownloadLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 downloads per minute
  keyPrefix: 'rl:file:download',
  message: 'Too many download requests. Please wait before downloading more files.',
})

/**
 * Payment endpoint rate limiters
 * Protects payment processing and callbacks
 */

// Payment Creation
export const paymentCreateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment requests per minute
  keyPrefix: 'rl:payment:create',
  message: 'Too many payment requests. Please wait before trying again.',
})

// Payment Callback (from payment provider)
export const paymentCallbackLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 callbacks per minute (allow for retries from provider)
  keyPrefix: 'rl:payment:callback',
  message: 'Too many callback requests.',
})
