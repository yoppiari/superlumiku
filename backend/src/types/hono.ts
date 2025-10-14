import { Context } from 'hono'

export interface AuthVariables {
  userId: string
  userEmail: string
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
  creditDeduction?: {
    appId: string
    action: string
    amount: number
    isEnterprise?: boolean
  }
}

export type AuthContext = Context<{ Variables: AuthVariables }>
