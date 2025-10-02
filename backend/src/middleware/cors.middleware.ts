import { cors } from 'hono/cors'
import { env } from '../config/env'

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
})