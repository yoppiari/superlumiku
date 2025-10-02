// Environment configuration
export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // File Storage
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  OUTPUT_PATH: process.env.OUTPUT_PATH || './outputs',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '524288000'),

  // Payment (Duitku)
  DUITKU_MERCHANT_CODE: process.env.DUITKU_MERCHANT_CODE || '',
  DUITKU_API_KEY: process.env.DUITKU_API_KEY || '',
  DUITKU_ENV: process.env.DUITKU_ENV || 'sandbox',
  DUITKU_CALLBACK_URL: process.env.DUITKU_CALLBACK_URL || '',
  DUITKU_RETURN_URL: process.env.DUITKU_RETURN_URL || '',

  // AI Services
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  // FFmpeg
  FFMPEG_PATH: process.env.FFMPEG_PATH || 'ffmpeg',
  FFPROBE_PATH: process.env.FFPROBE_PATH || 'ffprobe',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
} as const