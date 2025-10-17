/**
 * PM2 Ecosystem Configuration
 *
 * Process Manager configuration for running Lumiku backend services:
 * - Main API server (Hono + WebSocket)
 * - Avatar Creator worker (BullMQ consumer)
 * - Pose Generator worker (BullMQ consumer)
 *
 * Usage:
 *   npm run pm2:start     - Start all services
 *   npm run pm2:stop      - Stop all services
 *   npm run pm2:restart   - Restart all services
 *   npm run pm2:logs      - View logs in real-time
 *   npm run pm2:status    - Check service status
 *   npm run pm2:monit     - Interactive monitoring dashboard
 *
 * Production deployment:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save              - Save process list
 *   pm2 startup           - Generate startup script
 */

module.exports = {
  apps: [
    // ========================================
    // Main API Server
    // ========================================
    {
      name: 'lumiku-api',
      script: './src/index.ts',
      interpreter: 'bun',
      watch: false,
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Memory management
      max_memory_restart: '1G',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Advanced features
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },

    // ========================================
    // Pose Generator Worker
    // ========================================
    {
      name: 'pose-generator-worker',
      script: './src/apps/pose-generator/worker.ts',
      interpreter: 'bun',
      watch: false,
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        WORKER_CONCURRENCY: 3,
        WORKER_NAME: 'pose-generator-worker-dev',
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 5,
        WORKER_NAME: 'pose-generator-worker-prod',
      },

      // Memory management (higher for image processing)
      max_memory_restart: '2G',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Logging
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Advanced features
      kill_timeout: 30000, // 30s to allow job completion
      wait_ready: false,
    },

    // ========================================
    // Avatar Creator Worker
    // ========================================
    {
      name: 'avatar-generator-worker',
      script: './src/apps/avatar-creator/workers/avatar-generator.worker.ts',
      interpreter: 'bun',
      watch: false,
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        WORKER_CONCURRENCY: 2,
        WORKER_NAME: 'avatar-generator-worker-dev',
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 2,
        WORKER_NAME: 'avatar-generator-worker-prod',
      },

      // Memory management
      max_memory_restart: '1G',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Logging
      error_file: './logs/avatar-worker-error.log',
      out_file: './logs/avatar-worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Advanced features
      kill_timeout: 30000, // 30s to allow job completion
      wait_ready: false,
    },

    // ========================================
    // Additional Workers (Optional - Scale as needed)
    // ========================================
    // Uncomment to add more worker instances for higher throughput
    /*
    {
      name: 'pose-generator-worker-2',
      script: './src/apps/pose-generator/worker.ts',
      interpreter: 'bun',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 5,
        WORKER_NAME: 'pose-generator-worker-2',
      },
      max_memory_restart: '2G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      error_file: './logs/worker-2-error.log',
      out_file: './logs/worker-2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 30000,
    },
    */
  ],

  // ========================================
  // Deployment Configuration (Optional)
  // ========================================
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/lumiku.git',
      path: '/opt/lumiku',
      'post-deploy': 'bun install && bun run prisma:generate && bun run prisma:migrate && pm2 reload ecosystem.config.js --env production',
    },
  },
}
