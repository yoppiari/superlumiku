import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface AppConfig {
  appId: string           // 'task-scheduler'
  name: string            // 'Task Scheduler'
  description: string     // 'Schedule tasks with AI'
  icon: string            // 'calendar'
  color: string           // 'green'
  order: number           // 4
}

async function generateApp(config: AppConfig) {
  const appDir = path.join(__dirname, '../src/apps', config.appId)

  // 1. Create directories
  console.log(`\n📁 Creating directories...`)
  fs.mkdirSync(path.join(appDir, 'services'), { recursive: true })
  fs.mkdirSync(path.join(appDir, 'repositories'), { recursive: true })
  fs.mkdirSync(path.join(appDir, 'schemas'), { recursive: true })

  // 2. Generate plugin.config.ts
  console.log(`📝 Generating plugin.config.ts...`)
  const configContent = `import { PluginConfig } from '../../plugins/types'

export const ${toCamelCase(config.appId)}Config: PluginConfig = {
  appId: '${config.appId}',
  name: '${config.name}',
  description: '${config.description}',
  icon: '${config.icon}',
  version: '1.0.0',
  routePrefix: '/api/apps/${config.appId}',
  credits: {
    // Define your credit costs here
    exampleAction: 5,
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },
  dashboard: {
    order: ${config.order},
    color: '${config.color}',
    stats: {
      enabled: true,
      endpoint: '/api/apps/${config.appId}/stats',
    },
  },
}

export default ${toCamelCase(config.appId)}Config
`
  fs.writeFileSync(path.join(appDir, 'plugin.config.ts'), configContent)

  // 3. Generate routes.ts
  console.log(`📝 Generating routes.ts...`)
  const routesContent = `import { Hono } from 'hono'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { ${toPascalCase(config.appId)}Service } from './services/${config.appId}.service'
import { ${toCamelCase(config.appId)}Config } from './plugin.config'
import { z } from 'zod'

const routes = new Hono()
const service = new ${toPascalCase(config.appId)}Service()

// Add your routes here
routes.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    return c.json({
      success: true,
      message: 'Welcome to ${config.name}',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Example route with credit deduction
routes.post(
  '/example',
  authMiddleware,
  deductCredits(
    ${toCamelCase(config.appId)}Config.credits.exampleAction,
    'example_action',
    ${toCamelCase(config.appId)}Config.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()

      // Your logic here
      const result = { success: true }

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount
      )

      return c.json({
        success: true,
        result,
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

// Stats endpoint
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    // Your stats logic here
    const stats = {
      totalItems: 0,
    }

    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
`
  fs.writeFileSync(path.join(appDir, 'routes.ts'), routesContent)

  // 4. Generate service
  console.log(`📝 Generating service...`)
  const serviceContent = `import { ${toPascalCase(config.appId)}Repository } from '../repositories/${config.appId}.repository'

const repo = new ${toPascalCase(config.appId)}Repository()

export class ${toPascalCase(config.appId)}Service {
  async exampleMethod(userId: string, data: any) {
    // Your business logic here
    return { success: true }
  }
}
`
  fs.writeFileSync(path.join(appDir, 'services', `${config.appId}.service.ts`), serviceContent)

  // 5. Generate repository
  console.log(`📝 Generating repository...`)
  const repoContent = `import prisma from '../../../db/client'

export class ${toPascalCase(config.appId)}Repository {
  async findByUserId(userId: string) {
    // Your database queries here
    return []
  }
}
`
  fs.writeFileSync(path.join(appDir, 'repositories', `${config.appId}.repository.ts`), repoContent)

  // 6. Success message
  console.log(`\n✅ App generated successfully!`)
  console.log(`\n📋 Next steps:`)
  console.log(`1. Add database models to prisma/schema.prisma`)
  console.log(`2. Run: cd backend && bun prisma migrate dev --name add-${config.appId}-models`)
  console.log(`3. Implement business logic in services/`)
  console.log(`4. Add routes in routes.ts`)
  console.log(`5. Register in plugins/loader.ts:`)
  console.log(`   import ${toCamelCase(config.appId)}Config from '../apps/${config.appId}/plugin.config'`)
  console.log(`   import ${toCamelCase(config.appId)}Routes from '../apps/${config.appId}/routes'`)
  console.log(`   pluginRegistry.register(${toCamelCase(config.appId)}Config, ${toCamelCase(config.appId)}Routes)`)
  console.log(`\n6. Create frontend component in frontend/src/apps/${toPascalCase(config.appId)}.tsx`)
  console.log(`7. Add route in frontend/src/App.tsx\n`)
}

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// CLI interface
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
🚀 Lumiku App Generator

Usage:
  bun scripts/generate-app.ts <app-id> <name> <description> <icon> <color> <order>

Example:
  bun scripts/generate-app.ts task-scheduler "Task Scheduler" "Schedule tasks with AI" calendar green 4

Arguments:
  app-id      : Kebab-case ID (e.g., task-scheduler)
  name        : Display name (e.g., "Task Scheduler")
  description : Short description
  icon        : Lucide icon name (e.g., calendar)
  color       : Card color (e.g., green)
  order       : Dashboard order (e.g., 4)
`)
  process.exit(0)
}

if (args.length < 6) {
  console.error('❌ Error: Missing arguments')
  console.log('Run: bun scripts/generate-app.ts')
  process.exit(1)
}

const config: AppConfig = {
  appId: args[0],
  name: args[1],
  description: args[2],
  icon: args[3],
  color: args[4],
  order: parseInt(args[5]),
}

generateApp(config)
