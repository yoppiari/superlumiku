import { Context } from 'hono'
import { AuthVariables } from './hono'

/**
 * Typed context for authenticated routes
 */
export type AuthContext = Context<{ Variables: AuthVariables }>

/**
 * Common query parameters
 */
export interface PaginationQuery {
  limit?: string
  offset?: string
  page?: string
}

export interface SortQuery {
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FilterQuery {
  [key: string]: string | undefined
}

/**
 * Parsed pagination parameters with defaults
 */
export interface ParsedPagination {
  limit: number
  offset: number
  page?: number
}

/**
 * Credit balance response
 */
export interface CreditBalanceResponse {
  balance: number
}

/**
 * Credit transaction
 */
export interface CreditTransaction {
  id: string
  userId: string
  amount: number
  description: string
  metadata?: any
  createdAt: Date
}

/**
 * Credit history response
 */
export interface CreditHistoryResponse {
  history: CreditTransaction[]
}

/**
 * Device information
 */
export interface Device {
  id: string
  userId: string
  deviceId: string
  deviceName: string
  lastUsed: Date
  createdAt: Date
}

/**
 * Device list response
 */
export interface DeviceListResponse {
  devices: Device[]
}

/**
 * Device count response
 */
export interface DeviceCountResponse {
  count: number
  canAdd: boolean
  maxDevices: number
}

/**
 * Generation status
 */
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Generation filters
 */
export interface GenerationFilters {
  appId?: string
  status?: GenerationStatus
  limit?: number
  offset?: number
  sort?: 'latest' | 'oldest' | 'name'
}

/**
 * Generation item
 */
export interface Generation {
  id: string
  userId: string
  appId: string
  status: GenerationStatus
  name?: string
  outputUrl?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

/**
 * Generation list response
 */
export interface GenerationListResponse {
  generations: Generation[]
  total?: number
  page?: number
  limit?: number
}

/**
 * Recent generations response
 */
export interface RecentGenerationsResponse {
  generations: Generation[]
}

/**
 * Dashboard stats response
 */
export interface DashboardStatsResponse {
  totalSpending: number
  totalWorks: number
  totalProjects: number
  lastLogin: Date
  periodStart: Date
  periodEnd: Date
}

/**
 * Model usage entry
 */
export interface ModelUsage {
  id: string
  userId: string
  modelId: string
  createdAt: Date
  model: {
    name: string
    provider: string
    tier: string
  }
}

/**
 * Model usage response
 */
export interface ModelUsageResponse {
  usages: ModelUsage[]
}

/**
 * Popular model
 */
export interface PopularModel {
  modelKey: string
  name: string
  provider: string
  tier: string
  totalUsage: number
}

/**
 * Popular models response
 */
export interface PopularModelsResponse {
  models: PopularModel[]
}

/**
 * Quota breakdown by app
 */
export interface QuotaBreakdown {
  appId: string
  used: number
  limit?: number
}

/**
 * Quota status response
 */
export interface QuotaStatusResponse {
  remaining: number
  used: number
  limit: number
  resetAt: Date
  breakdown: QuotaBreakdown[]
}

/**
 * Quota usage entry
 */
export interface QuotaUsageEntry {
  id: string
  userId: string
  amount: number
  date: Date
}

/**
 * Quota history response
 */
export interface QuotaHistoryResponse {
  history: QuotaUsageEntry[]
}

/**
 * Subscription plan
 */
export interface SubscriptionPlan {
  id: string
  name: string
  tier: string
  price: number
  features: any
  isActive: boolean
  displayOrder: number
}

/**
 * Subscription plans response
 */
export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[]
}

/**
 * User subscription
 */
export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: string
  startDate: Date
  endDate?: Date
  plan: SubscriptionPlan
}

/**
 * Subscription status response
 */
export interface SubscriptionStatusResponse {
  subscription: UserSubscription | null
  tier: string
  isActive?: boolean
}

/**
 * Subscribe request body
 */
export interface SubscribeRequest {
  planId: string
}

/**
 * Cancel subscription request body
 */
export interface CancelSubscriptionRequest {
  reason?: string
}

/**
 * Change plan request body
 */
export interface ChangePlanRequest {
  newPlanId: string
}

/**
 * Pose template filters
 */
export interface PoseTemplateFilters {
  category?: string
  difficulty?: string
  gender?: string
  tags?: string
  isActive?: boolean
  limit?: number
  offset?: number
  sort?: 'popular' | 'quality' | 'recent' | 'random'
}

/**
 * Pose template
 */
export interface PoseTemplate {
  id: string
  name: string
  category: string
  difficulty: string
  gender: string
  imageUrl: string
  poseData?: any
  tags: string[]
  isActive: boolean
  usageCount: number
  qualityScore: number
  createdAt: Date
}

/**
 * Pose template list response
 */
export interface PoseTemplateListResponse {
  data: PoseTemplate[]
  total: number
  page?: number
  limit?: number
}

/**
 * Pose template single response
 */
export interface PoseTemplateResponse {
  data: PoseTemplate
}

/**
 * Pose template stats
 */
export interface PoseTemplateStats {
  total: number
  active: number
  categories: Record<string, number>
  difficulties: Record<string, number>
  genders: Record<string, number>
}

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  packageId: string
  credits: number
  amount: number
  productName: string
}

/**
 * Payment response
 */
export interface PaymentResponse {
  message: string
  merchantOrderId?: string
  paymentUrl?: string
  reference?: string
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  merchantOrderId: string
  status: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Helper function to parse pagination query parameters
 */
export function parsePagination(
  limitQuery?: string,
  offsetQuery?: string,
  pageQuery?: string,
  defaultLimit: number = 20,
  maxLimit: number = 100
): ParsedPagination {
  const limit = limitQuery
    ? Math.min(Math.max(parseInt(limitQuery), 1), maxLimit)
    : defaultLimit

  const offset = offsetQuery ? Math.max(parseInt(offsetQuery), 0) : 0

  const page = pageQuery ? Math.max(parseInt(pageQuery), 1) : undefined

  return { limit, offset, page }
}

/**
 * Helper function to validate required query parameter
 */
export function requireQueryParam(value: string | undefined, paramName: string): string {
  if (!value) {
    throw new Error(`Query parameter '${paramName}' is required`)
  }
  return value
}
