/**
 * Pose Request Service
 *
 * Phase 3: Community Features - Pose Request System
 *
 * This service handles community-driven pose requests where users can:
 * 1. Request new poses to be added to the library
 * 2. Vote on existing requests (upvote system)
 * 3. Track the status of their requests (pending, approved, in_progress, completed, rejected)
 * 4. View popular community requests
 *
 * Admin Workflow:
 * - Admins can approve/reject requests
 * - Approved requests go into production queue
 * - Completed requests link to the new pose in library
 * - Rejected requests include admin notes for feedback
 *
 * Features:
 * - Pagination support for large request lists
 * - Vote tracking to identify popular requests
 * - Category association for organization
 * - Reference image support for visual clarity
 * - Use case tracking for prioritization
 *
 * @module services/pose-request
 */

import prisma from '../../../db/client'
import { ValidationError } from '../../../core/errors/errors'
import type { PoseRequest, CreatePoseRequestRequest, PaginationMeta } from '../types'

/**
 * Filters for pose request queries
 */
export interface PoseRequestFilters {
  status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  categoryId?: string
  userId?: string // For filtering user's own requests
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Pose Request Service Class
 *
 * Provides CRUD operations and business logic for pose requests.
 */
export class PoseRequestService {
  /**
   * Create a new pose request
   *
   * Validates the request data and creates a new pose request record.
   * Initial status is always 'pending' for admin review.
   *
   * @param userId - User ID making the request
   * @param data - Request data
   * @returns Created pose request
   * @throws ValidationError if validation fails
   */
  async createPoseRequest(
    userId: string,
    data: CreatePoseRequestRequest
  ): Promise<PoseRequest> {
    // Validate required fields
    if (!data.poseName || data.poseName.trim().length === 0) {
      throw new ValidationError('Pose name is required')
    }

    if (data.poseName.length > 100) {
      throw new ValidationError('Pose name must be 100 characters or less')
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Description is required')
    }

    if (data.description.length > 500) {
      throw new ValidationError('Description must be 500 characters or less')
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.poseCategory.findUnique({
        where: { id: data.categoryId },
      })

      if (!category) {
        throw new ValidationError(`Category ${data.categoryId} not found`)
      }
    }

    // Validate reference image URL if provided
    if (data.referenceImageUrl) {
      try {
        new URL(data.referenceImageUrl)
      } catch {
        // If not a full URL, check if it's a relative path
        if (!data.referenceImageUrl.startsWith('/uploads/')) {
          throw new ValidationError('Invalid reference image URL')
        }
      }
    }

    // Check for duplicate requests (same user, same pose name, pending)
    const existingRequest = await prisma.poseRequest.findFirst({
      where: {
        userId,
        poseName: data.poseName,
        status: {
          in: ['pending', 'approved', 'in_progress'],
        },
      },
    })

    if (existingRequest) {
      throw new ValidationError(
        `You already have a ${existingRequest.status} request for "${data.poseName}"`
      )
    }

    // Create the request
    const request = await prisma.poseRequest.create({
      data: {
        userId,
        poseName: data.poseName.trim(),
        description: data.description.trim(),
        categoryId: data.categoryId || null,
        useCase: data.useCase || null,
        referenceImageUrl: data.referenceImageUrl || null,
        votesCount: 0,
        status: 'pending',
        adminNotes: null,
        completedPoseId: null,
      },
    })

    console.log(`[Pose Request] Created request ${request.id} by user ${userId}`)

    return request as PoseRequest
  }

  /**
   * Get user's pose requests with pagination
   *
   * Returns all requests made by the user, sorted by creation date (newest first).
   *
   * @param userId - User ID to get requests for
   * @param pagination - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated pose requests
   */
  async getUserPoseRequests(
    userId: string,
    pagination: PaginationParams,
    filters?: PoseRequestFilters
  ): Promise<{
    requests: PoseRequest[]
    pagination: PaginationMeta
  }> {
    const { page, limit } = pagination

    // Build where clause
    const where: any = {
      userId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }

    // Get total count
    const total = await prisma.poseRequest.count({ where })

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Get requests
    const requests = await prisma.poseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        category: true, // Include category details
        completedPose: true, // Include completed pose if available
      },
    })

    return {
      requests: requests as PoseRequest[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    }
  }

  /**
   * Get all pose requests (admin view)
   *
   * Returns all pose requests across all users with pagination and filters.
   * Admin-only access.
   *
   * @param pagination - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated pose requests
   */
  async getAllPoseRequests(
    pagination: PaginationParams,
    filters?: PoseRequestFilters
  ): Promise<{
    requests: PoseRequest[]
    pagination: PaginationMeta
  }> {
    const { page, limit } = pagination

    // Build where clause
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    // Get total count
    const total = await prisma.poseRequest.count({ where })

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Get requests
    const requests = await prisma.poseRequest.findMany({
      where,
      orderBy: [
        { votesCount: 'desc' }, // Sort by votes first (most popular)
        { createdAt: 'desc' }, // Then by date
      ],
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        completedPose: true,
      },
    })

    return {
      requests: requests as any[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    }
  }

  /**
   * Get a single pose request by ID
   *
   * @param requestId - Request ID
   * @param userId - Optional user ID for ownership check
   * @returns Pose request
   * @throws ValidationError if not found
   */
  async getPoseRequestById(
    requestId: string,
    userId?: string
  ): Promise<PoseRequest> {
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
      include: {
        category: true,
        completedPose: true,
      },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    // If userId provided, verify ownership (unless admin)
    if (userId && request.userId !== userId) {
      throw new ValidationError('You do not have permission to view this request')
    }

    return request as PoseRequest
  }

  /**
   * Vote on a pose request (upvote)
   *
   * Users can vote on requests to show interest.
   * Currently simplified: just increments count (no vote tracking per user).
   *
   * TODO: Phase 4 - Add PoseRequestVote table to track individual votes
   * and prevent duplicate voting.
   *
   * @param userId - User ID voting
   * @param requestId - Request ID to vote on
   * @returns Updated pose request
   */
  async votePoseRequest(userId: string, requestId: string): Promise<PoseRequest> {
    // Get the request
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    // Can't vote on your own request
    if (request.userId === userId) {
      throw new ValidationError('You cannot vote on your own request')
    }

    // Can only vote on pending or approved requests
    if (!['pending', 'approved'].includes(request.status)) {
      throw new ValidationError(`Cannot vote on ${request.status} requests`)
    }

    // TODO: Check if user already voted (requires PoseRequestVote table)
    // For now, just increment the count
    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        votesCount: { increment: 1 },
      },
    })

    console.log(`[Pose Request] User ${userId} voted on request ${requestId}`)

    return updatedRequest as PoseRequest
  }

  /**
   * Get popular pose requests (most votes)
   *
   * Returns the top N most voted requests.
   * Useful for admin dashboard to see what users want most.
   *
   * @param limit - Number of requests to return
   * @returns Popular pose requests
   */
  async getPopularPoseRequests(limit: number = 20): Promise<PoseRequest[]> {
    const requests = await prisma.poseRequest.findMany({
      where: {
        status: {
          in: ['pending', 'approved', 'in_progress'],
        },
      },
      orderBy: [
        { votesCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return requests as any[]
  }

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * Approve a pose request (admin only)
   *
   * Changes status to 'approved' and optionally adds admin notes.
   *
   * @param requestId - Request ID to approve
   * @param adminNotes - Optional notes for the user
   * @returns Updated pose request
   */
  async approvePoseRequest(
    requestId: string,
    adminNotes?: string
  ): Promise<PoseRequest> {
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    if (request.status !== 'pending') {
      throw new ValidationError(`Cannot approve ${request.status} request`)
    }

    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        adminNotes: adminNotes || null,
        updatedAt: new Date(),
      },
    })

    console.log(`[Pose Request] Approved request ${requestId}`)

    return updatedRequest as PoseRequest
  }

  /**
   * Reject a pose request (admin only)
   *
   * Changes status to 'rejected' and adds admin notes explaining why.
   *
   * @param requestId - Request ID to reject
   * @param adminNotes - Reason for rejection
   * @returns Updated pose request
   */
  async rejectPoseRequest(
    requestId: string,
    adminNotes: string
  ): Promise<PoseRequest> {
    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new ValidationError('Admin notes are required when rejecting a request')
    }

    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    if (request.status !== 'pending') {
      throw new ValidationError(`Cannot reject ${request.status} request`)
    }

    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        adminNotes,
        updatedAt: new Date(),
      },
    })

    console.log(`[Pose Request] Rejected request ${requestId}`)

    return updatedRequest as PoseRequest
  }

  /**
   * Mark pose request as in progress (admin only)
   *
   * Indicates that the pose is being created.
   *
   * @param requestId - Request ID
   * @param adminNotes - Optional progress notes
   * @returns Updated pose request
   */
  async markInProgress(
    requestId: string,
    adminNotes?: string
  ): Promise<PoseRequest> {
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    if (request.status !== 'approved') {
      throw new ValidationError('Only approved requests can be marked as in progress')
    }

    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        status: 'in_progress',
        adminNotes: adminNotes || request.adminNotes,
        updatedAt: new Date(),
      },
    })

    console.log(`[Pose Request] Marked request ${requestId} as in progress`)

    return updatedRequest as PoseRequest
  }

  /**
   * Mark pose request as completed (admin only)
   *
   * Links the completed pose library item to the request.
   *
   * @param requestId - Request ID
   * @param completedPoseId - Library pose ID that was created
   * @param adminNotes - Optional completion notes
   * @returns Updated pose request
   */
  async markCompleted(
    requestId: string,
    completedPoseId: string,
    adminNotes?: string
  ): Promise<PoseRequest> {
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    if (request.status !== 'in_progress') {
      throw new ValidationError('Only in-progress requests can be marked as completed')
    }

    // Verify the pose exists
    const pose = await prisma.poseLibraryItem.findUnique({
      where: { id: completedPoseId },
    })

    if (!pose) {
      throw new ValidationError(`Pose ${completedPoseId} not found in library`)
    }

    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        completedPoseId,
        adminNotes: adminNotes || request.adminNotes,
        updatedAt: new Date(),
      },
    })

    console.log(`[Pose Request] Marked request ${requestId} as completed with pose ${completedPoseId}`)

    return updatedRequest as PoseRequest
  }

  /**
   * Update admin notes (admin only)
   *
   * Add or update notes on any request.
   *
   * @param requestId - Request ID
   * @param adminNotes - Admin notes
   * @returns Updated pose request
   */
  async updateAdminNotes(
    requestId: string,
    adminNotes: string
  ): Promise<PoseRequest> {
    const request = await prisma.poseRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new ValidationError(`Pose request ${requestId} not found`)
    }

    const updatedRequest = await prisma.poseRequest.update({
      where: { id: requestId },
      data: {
        adminNotes,
        updatedAt: new Date(),
      },
    })

    console.log(`[Pose Request] Updated admin notes for request ${requestId}`)

    return updatedRequest as PoseRequest
  }

  /**
   * Get statistics for admin dashboard
   *
   * Returns counts of requests by status.
   *
   * @returns Statistics object
   */
  async getStatistics(): Promise<{
    total: number
    pending: number
    approved: number
    inProgress: number
    completed: number
    rejected: number
  }> {
    const [total, pending, approved, inProgress, completed, rejected] = await Promise.all([
      prisma.poseRequest.count(),
      prisma.poseRequest.count({ where: { status: 'pending' } }),
      prisma.poseRequest.count({ where: { status: 'approved' } }),
      prisma.poseRequest.count({ where: { status: 'in_progress' } }),
      prisma.poseRequest.count({ where: { status: 'completed' } }),
      prisma.poseRequest.count({ where: { status: 'rejected' } }),
    ])

    return {
      total,
      pending,
      approved,
      inProgress,
      completed,
      rejected,
    }
  }
}

/**
 * Singleton instance
 */
export const poseRequestService = new PoseRequestService()
