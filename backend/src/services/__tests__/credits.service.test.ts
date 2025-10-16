/**
 * Credits Service Test Suite
 *
 * Comprehensive tests for the centralized credits service.
 * Tests cover:
 * - Enterprise unlimited access
 * - Credit balance checking
 * - Atomic credit deduction
 * - Credit refunds
 * - Race condition prevention
 * - Error handling
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { CreditsService } from '../credits.service'
import { InsufficientCreditsError } from '../../core/errors'
import prisma from '../../db/client'

describe('CreditsService', () => {
  const service = new CreditsService()
  let testUserId: string
  let enterpriseUserId: string

  beforeEach(async () => {
    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed_password',
        userTags: JSON.stringify([]),
      },
    })
    testUserId = testUser.id

    const enterpriseUser = await prisma.user.create({
      data: {
        email: `enterprise-${Date.now()}@example.com`,
        name: 'Enterprise User',
        password: 'hashed_password',
        userTags: JSON.stringify(['enterprise_unlimited']),
      },
    })
    enterpriseUserId = enterpriseUser.id

    // Add initial credits to test user
    await prisma.credit.create({
      data: {
        userId: testUserId,
        amount: 100,
        balance: 100,
        type: 'admin_grant',
        description: 'Initial test credits',
      },
    })
  })

  afterEach(async () => {
    // Cleanup test data
    await prisma.appUsage.deleteMany({
      where: {
        userId: { in: [testUserId, enterpriseUserId] },
      },
    })

    await prisma.credit.deleteMany({
      where: {
        userId: { in: [testUserId, enterpriseUserId] },
      },
    })

    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, enterpriseUserId] },
      },
    })
  })

  describe('hasEnterpriseUnlimited', () => {
    test('should return true for user with enterprise_unlimited tag', async () => {
      const result = await service.hasEnterpriseUnlimited(enterpriseUserId)
      expect(result).toBe(true)
    })

    test('should return false for regular user', async () => {
      const result = await service.hasEnterpriseUnlimited(testUserId)
      expect(result).toBe(false)
    })

    test('should return false for non-existent user', async () => {
      const result = await service.hasEnterpriseUnlimited('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('getBalance', () => {
    test('should return current credit balance', async () => {
      const balance = await service.getBalance(testUserId)
      expect(balance).toBe(100)
    })

    test('should return 0 for user with no credits', async () => {
      const balance = await service.getBalance(enterpriseUserId)
      expect(balance).toBe(0)
    })

    test('should return most recent balance', async () => {
      // Add more credits
      await prisma.credit.create({
        data: {
          userId: testUserId,
          amount: 50,
          balance: 150,
          type: 'admin_grant',
          description: 'Additional credits',
        },
      })

      const balance = await service.getBalance(testUserId)
      expect(balance).toBe(150)
    })
  })

  describe('checkBalance', () => {
    test('should allow enterprise user to proceed regardless of balance', async () => {
      const result = await service.checkBalance(enterpriseUserId, 1000, 'avatar-creator')
      expect(result.canProceed).toBe(true)
      expect(result.hasEnterpriseUnlimited).toBe(true)
      expect(result.balance).toBe(0)
    })

    test('should allow regular user with sufficient balance', async () => {
      const result = await service.checkBalance(testUserId, 50, 'avatar-creator')
      expect(result.canProceed).toBe(true)
      expect(result.hasEnterpriseUnlimited).toBe(false)
      expect(result.balance).toBe(100)
    })

    test('should reject regular user with insufficient balance', async () => {
      const result = await service.checkBalance(testUserId, 150, 'avatar-creator')
      expect(result.canProceed).toBe(false)
      expect(result.hasEnterpriseUnlimited).toBe(false)
      expect(result.balance).toBe(100)
    })
  })

  describe('deduct', () => {
    test('should deduct credits from regular user', async () => {
      const result = await service.deduct({
        userId: testUserId,
        amount: 30,
        action: 'test_action',
        appId: 'test-app',
        metadata: { test: true },
      })

      expect(result.creditUsed).toBe(30)
      expect(result.newBalance).toBe(70)
      expect(result.isEnterprise).toBe(false)
      expect(result.transactionId).toBeTruthy()

      // Verify balance updated correctly
      const newBalance = await service.getBalance(testUserId)
      expect(newBalance).toBe(70)
    })

    test('should throw InsufficientCreditsError when balance is too low', async () => {
      await expect(
        service.deduct({
          userId: testUserId,
          amount: 150,
          action: 'test_action',
          appId: 'test-app',
        })
      ).rejects.toThrow(InsufficientCreditsError)
    })

    test('should not deduct credits from enterprise user', async () => {
      const result = await service.deduct({
        userId: enterpriseUserId,
        amount: 1000,
        action: 'test_action',
        appId: 'avatar-creator', // Supported app
      })

      expect(result.creditUsed).toBe(0)
      expect(result.isEnterprise).toBe(true)
      expect(result.transactionId).toBeNull()

      // Verify app usage was still logged
      const usage = await prisma.appUsage.findFirst({
        where: {
          userId: enterpriseUserId,
          appId: 'avatar-creator',
        },
      })

      expect(usage).toBeTruthy()
      expect(usage?.creditUsed).toBe(0)
    })

    test('should create app usage record', async () => {
      await service.deduct({
        userId: testUserId,
        amount: 10,
        action: 'generate_avatar',
        appId: 'avatar-creator',
        metadata: { projectId: 'test-project' },
      })

      const usage = await prisma.appUsage.findFirst({
        where: {
          userId: testUserId,
          appId: 'avatar-creator',
          action: 'generate_avatar',
        },
      })

      expect(usage).toBeTruthy()
      expect(usage?.creditUsed).toBe(10)

      const metadata = JSON.parse(usage?.metadata || '{}')
      expect(metadata.projectId).toBe('test-project')
    })

    test('should be atomic - concurrent deductions should not overdraw', async () => {
      // This test simulates race condition by making multiple concurrent deductions
      const promises = [
        service.deduct({
          userId: testUserId,
          amount: 30,
          action: 'test_1',
          appId: 'test-app',
        }),
        service.deduct({
          userId: testUserId,
          amount: 30,
          action: 'test_2',
          appId: 'test-app',
        }),
        service.deduct({
          userId: testUserId,
          amount: 30,
          action: 'test_3',
          appId: 'test-app',
        }),
        service.deduct({
          userId: testUserId,
          amount: 30,
          action: 'test_4',
          appId: 'test-app',
        }),
      ]

      // At least one should fail (100 credits / 30 per request = max 3 successful)
      const results = await Promise.allSettled(promises)

      const successful = results.filter((r) => r.status === 'fulfilled')
      const failed = results.filter((r) => r.status === 'rejected')

      expect(successful.length).toBeLessThanOrEqual(3)
      expect(failed.length).toBeGreaterThanOrEqual(1)

      // Verify final balance is never negative
      const finalBalance = await service.getBalance(testUserId)
      expect(finalBalance).toBeGreaterThanOrEqual(0)
    })
  })

  describe('refund', () => {
    test('should refund credits to user', async () => {
      // First deduct some credits
      await service.deduct({
        userId: testUserId,
        amount: 40,
        action: 'test_action',
        appId: 'test-app',
      })

      // Then refund them
      const newBalance = await service.refund({
        userId: testUserId,
        amount: 40,
        reason: 'Generation failed',
        referenceId: 'test-gen-id',
      })

      expect(newBalance).toBe(100) // Back to original

      // Verify refund record exists
      const refundRecord = await prisma.credit.findFirst({
        where: {
          userId: testUserId,
          type: 'refund',
        },
      })

      expect(refundRecord).toBeTruthy()
      expect(refundRecord?.amount).toBe(40)
    })

    test('should not refund 0 credits for enterprise users', async () => {
      const newBalance = await service.refund({
        userId: enterpriseUserId,
        amount: 0,
        reason: 'Enterprise user refund',
      })

      expect(newBalance).toBe(0)

      // Verify no refund record was created
      const refundRecord = await prisma.credit.findFirst({
        where: {
          userId: enterpriseUserId,
          type: 'refund',
        },
      })

      expect(refundRecord).toBeNull()
    })
  })

  describe('add', () => {
    test('should add credits from purchase', async () => {
      const newBalance = await service.add(
        testUserId,
        200,
        'purchase',
        'Credit package purchase',
        'payment-123'
      )

      expect(newBalance).toBe(300)

      const creditRecord = await prisma.credit.findFirst({
        where: {
          userId: testUserId,
          type: 'purchase',
          referenceId: 'payment-123',
        },
      })

      expect(creditRecord).toBeTruthy()
      expect(creditRecord?.amount).toBe(200)
    })

    test('should add credits from admin grant', async () => {
      const newBalance = await service.add(
        testUserId,
        50,
        'admin_grant',
        'Promotional credits'
      )

      expect(newBalance).toBe(150)
    })
  })

  describe('getHistory', () => {
    test('should return credit history with pagination', async () => {
      // Create some history
      await service.deduct({
        userId: testUserId,
        amount: 10,
        action: 'action_1',
        appId: 'test-app',
      })

      await service.deduct({
        userId: testUserId,
        amount: 20,
        action: 'action_2',
        appId: 'test-app',
      })

      const history = await service.getHistory(testUserId, 10, 0)

      expect(history.records.length).toBeGreaterThan(0)
      expect(history.total).toBeGreaterThan(0)
      expect(history.limit).toBe(10)
      expect(history.offset).toBe(0)
    })
  })

  describe('getUsageStats', () => {
    test('should return usage statistics', async () => {
      // Create some usage
      await service.deduct({
        userId: testUserId,
        amount: 10,
        action: 'action_1',
        appId: 'app-1',
      })

      await service.deduct({
        userId: testUserId,
        amount: 20,
        action: 'action_2',
        appId: 'app-1',
      })

      await service.deduct({
        userId: testUserId,
        amount: 15,
        action: 'action_3',
        appId: 'app-2',
      })

      const stats = await service.getUsageStats(testUserId)

      expect(stats.totalCreditsUsed).toBe(45)
      expect(stats.totalOperations).toBe(3)
      expect(stats.byApp['app-1'].creditsUsed).toBe(30)
      expect(stats.byApp['app-2'].creditsUsed).toBe(15)
    })

    test('should filter stats by appId', async () => {
      await service.deduct({
        userId: testUserId,
        amount: 10,
        action: 'action_1',
        appId: 'app-1',
      })

      await service.deduct({
        userId: testUserId,
        amount: 20,
        action: 'action_2',
        appId: 'app-2',
      })

      const stats = await service.getUsageStats(testUserId, 'app-1')

      expect(stats.totalCreditsUsed).toBe(10)
      expect(stats.totalOperations).toBe(1)
    })
  })
})
