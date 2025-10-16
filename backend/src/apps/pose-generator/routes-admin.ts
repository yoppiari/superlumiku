/**
 * Pose Generator Admin Routes
 *
 * Phase 3: Community Features - Admin Approval Workflow
 *
 * Admin-only routes for managing pose requests submitted by users.
 * These routes are protected by both authMiddleware and admin role check.
 *
 * Workflow:
 * 1. User submits pose request → Status: pending
 * 2. Admin reviews and approves → Status: approved
 * 3. Admin starts working on it → Status: in_progress
 * 4. Admin completes and links pose → Status: completed
 * OR
 * 2. Admin rejects with reason → Status: rejected
 *
 * Features:
 * - List all pose requests with filters
 * - Approve/reject pending requests
 * - Update status (in_progress, completed)
 * - Add admin notes for feedback
 * - View request statistics
 *
 * @module routes-admin
 */

import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { asyncHandler } from '../../core/errors/ErrorHandler'
import { poseRequestService } from './services/pose-request.service'

const app = new Hono<{ Variables: AuthVariables }>()

/**
 * Admin middleware
 *
 * Verifies that the authenticated user has admin role.
 * Must be used after authMiddleware.
 */
const adminMiddleware = asyncHandler(async (c, next) => {
  const user = c.get('user')

  if (!user || user.role !== 'ADMIN') {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    )
  }

  await next()
}, 'Admin Middleware')

// ========================================
// POSE REQUEST MANAGEMENT
// ========================================

/**
 * GET /api/apps/pose-generator/admin/pose-requests
 * List all pose requests (admin view)
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (pending, approved, in_progress, completed, rejected)
 * - categoryId: Filter by category
 * - userId: Filter by user
 *
 * Returns: Paginated list of all pose requests with user details
 */
app.get(
  '/pose-requests',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { page = '1', limit = '20', status, categoryId, userId } = c.req.query()

    const result = await poseRequestService.getAllPoseRequests(
      {
        page: parseInt(page),
        limit: parseInt(limit),
      },
      {
        status: status as any,
        categoryId,
        userId,
      }
    )

    return c.json({
      requests: result.requests,
      pagination: result.pagination,
    })
  }, 'List All Pose Requests (Admin)')
)

/**
 * GET /api/apps/pose-generator/admin/pose-requests/:id
 * Get single pose request details (admin view)
 *
 * Returns: Full request details with user info
 */
app.get(
  '/pose-requests/:id',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()

    const request = await poseRequestService.getPoseRequestById(id)

    return c.json({
      request,
    })
  }, 'Get Pose Request Details (Admin)')
)

/**
 * POST /api/apps/pose-generator/admin/pose-requests/:id/approve
 * Approve a pending pose request
 *
 * Request Body:
 * - adminNotes: string (optional) - Approval message or notes
 *
 * Returns: Updated pose request
 */
app.post(
  '/pose-requests/:id/approve',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()
    const { adminNotes } = await c.req.json()

    const request = await poseRequestService.approvePoseRequest(id, adminNotes)

    return c.json({
      request,
      message: 'Pose request approved successfully',
    })
  }, 'Approve Pose Request')
)

/**
 * POST /api/apps/pose-generator/admin/pose-requests/:id/reject
 * Reject a pending pose request
 *
 * Request Body:
 * - adminNotes: string (required) - Reason for rejection
 *
 * Returns: Updated pose request
 */
app.post(
  '/pose-requests/:id/reject',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()
    const { adminNotes } = await c.req.json()

    if (!adminNotes || adminNotes.trim().length === 0) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Admin notes are required when rejecting a request',
        },
        400
      )
    }

    const request = await poseRequestService.rejectPoseRequest(id, adminNotes)

    return c.json({
      request,
      message: 'Pose request rejected',
    })
  }, 'Reject Pose Request')
)

/**
 * POST /api/apps/pose-generator/admin/pose-requests/:id/mark-in-progress
 * Mark an approved request as in progress
 *
 * Request Body:
 * - adminNotes: string (optional) - Progress update
 *
 * Returns: Updated pose request
 */
app.post(
  '/pose-requests/:id/mark-in-progress',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()
    const { adminNotes } = await c.req.json()

    const request = await poseRequestService.markInProgress(id, adminNotes)

    return c.json({
      request,
      message: 'Pose request marked as in progress',
    })
  }, 'Mark In Progress')
)

/**
 * POST /api/apps/pose-generator/admin/pose-requests/:id/mark-completed
 * Mark an in-progress request as completed
 *
 * Request Body:
 * - completedPoseId: string (required) - Library pose ID that was created
 * - adminNotes: string (optional) - Completion notes
 *
 * Returns: Updated pose request
 */
app.post(
  '/pose-requests/:id/mark-completed',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()
    const { completedPoseId, adminNotes } = await c.req.json()

    if (!completedPoseId || completedPoseId.trim().length === 0) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Completed pose ID is required',
        },
        400
      )
    }

    const request = await poseRequestService.markCompleted(id, completedPoseId, adminNotes)

    return c.json({
      request,
      message: 'Pose request marked as completed',
    })
  }, 'Mark Completed')
)

/**
 * PUT /api/apps/pose-generator/admin/pose-requests/:id/notes
 * Update admin notes on any request
 *
 * Request Body:
 * - adminNotes: string (required) - Updated notes
 *
 * Returns: Updated pose request
 */
app.put(
  '/pose-requests/:id/notes',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { id } = c.req.param()
    const { adminNotes } = await c.req.json()

    if (!adminNotes || adminNotes.trim().length === 0) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Admin notes cannot be empty',
        },
        400
      )
    }

    const request = await poseRequestService.updateAdminNotes(id, adminNotes)

    return c.json({
      request,
      message: 'Admin notes updated successfully',
    })
  }, 'Update Admin Notes')
)

/**
 * GET /api/apps/pose-generator/admin/pose-requests/stats
 * Get pose request statistics
 *
 * Returns: Count of requests by status
 */
app.get(
  '/pose-requests/stats',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const stats = await poseRequestService.getStatistics()

    return c.json(stats)
  }, 'Get Request Statistics')
)

/**
 * GET /api/apps/pose-generator/admin/pose-requests/popular
 * Get most popular pose requests (by votes)
 *
 * Query Parameters:
 * - limit: Number of requests to return (default: 20)
 *
 * Returns: Top voted pose requests
 */
app.get(
  '/pose-requests/popular',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (c) => {
    const { limit = '20' } = c.req.query()

    const requests = await poseRequestService.getPopularPoseRequests(parseInt(limit))

    return c.json({
      requests,
    })
  }, 'Get Popular Requests')
)

export default app
