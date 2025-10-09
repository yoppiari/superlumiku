import { PluginConfig } from '../../plugins/types'

/**
 * Poster Editor Plugin Configuration
 *
 * Pricing Strategy:
 * - 1 Credit = Rp 50
 * - Enterprise Plan: UNLIMITED API calls = FREE!
 * - Base pricing untuk testing (akan FREE dengan Enterprise)
 */

export const posterEditorConfig: PluginConfig = {
  // Identity
  appId: 'poster-editor',
  name: 'Smart Poster Editor',
  description: 'AI-powered poster text editing, enhancement, and multi-format export',
  icon: 'image',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/poster-editor',

  // Credits per action
  credits: {
    // ========================================
    // Free Actions
    // ========================================
    upload: 0, // Upload poster
    detectText: 0, // OCR text detection (Tesseract.js local)
    editText: 0, // Text editing (client-side)
    resize: 0, // Resize without upscale (Sharp local)
    export: 0, // Download/export file

    // ========================================
    // AI Actions (FREE with Enterprise Plan!)
    // ========================================
    // 🧪 TRIAL MODE - Credits set to 0
    // Production dengan Enterprise: TETAP 0 (UNLIMITED)

    // AI Text Removal (ModelsLab Inpainting)
    // Production: 10 credits | Enterprise: 0 credits (UNLIMITED)
    removeText: 0,

    // AI Enhancement (ModelsLab Super Resolution)
    // Production pricing | Enterprise: 0 credits (UNLIMITED)
    enhance2x: 0, // 5 credits → 0 (Enterprise)
    enhance3x: 0, // 10 credits → 0 (Enterprise)
    enhance4x: 0, // 20 credits → 0 (Enterprise)

    // Resize + Upscale (kombinasi)
    // Production pricing | Enterprise: 0 credits (UNLIMITED)
    resizeUpscale: 0, // 5 credits per format → 0 (Enterprise)

    // ========================================
    // Batch Operations
    // ========================================
    // Batch export (multiple formats)
    // Cost = (number of formats × resizeUpscale cost)
    // Production: 5 credits × formats | Enterprise: 0 (UNLIMITED)
    batchExport: 0,

    // ========================================
    // Bridge to App 2
    // ========================================
    sendToVariations: 0, // FREE - just create link
  },

  // Access control
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true, // Enabled in both dev and production
    beta: false, // Stable feature
    comingSoon: false,
  },

  // Dashboard config
  dashboard: {
    order: 5, // Display order in dashboard
    color: 'green', // Green theme for image editing
    stats: {
      enabled: true,
      endpoint: '/api/apps/poster-editor/stats',
    },
  },
}

export default posterEditorConfig
