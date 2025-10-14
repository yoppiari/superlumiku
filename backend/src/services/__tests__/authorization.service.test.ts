import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { authorizationService } from '../authorization.service'
import { ResourceNotFoundError, AuthorizationError } from '../../errors/AuthorizationError'
import prisma from '../../db/client'

/**
 * Authorization Service Test Suite
 *
 * Tests the centralized authorization service to ensure:
 * 1. Users can only access their own resources
 * 2. Unauthorized access returns proper errors
 * 3. Batch operations work correctly
 * 4. Error messages don't leak information
 *
 * Security Testing Strategy:
 * - Test positive cases (authorized access)
 * - Test negative cases (unauthorized access)
 * - Test edge cases (non-existent resources)
 * - Verify error responses hide resource existence
 */

describe('AuthorizationService - Carousel Mix', () => {
  let userAId: string
  let userBId: string
  let projectAId: string
  let projectBId: string
  let slideAId: string
  let slideBId: string
  let textAId: string
  let textBId: string

  beforeEach(async () => {
    // Create test users
    const userA = await prisma.user.create({
      data: {
        email: 'usera@test.com',
        passwordHash: 'hash',
        name: 'User A',
      },
    })
    const userB = await prisma.user.create({
      data: {
        email: 'userb@test.com',
        passwordHash: 'hash',
        name: 'User B',
      },
    })

    userAId = userA.id
    userBId = userB.id

    // Create test projects
    const projectA = await prisma.carouselProject.create({
      data: {
        userId: userAId,
        name: 'Project A',
      },
    })
    const projectB = await prisma.carouselProject.create({
      data: {
        userId: userBId,
        name: 'Project B',
      },
    })

    projectAId = projectA.id
    projectBId = projectB.id

    // Create test slides
    const slideA = await prisma.carouselSlide.create({
      data: {
        projectId: projectAId,
        fileName: 'slide-a.jpg',
        filePath: '/test/slide-a.jpg',
        fileType: 'image',
        fileSize: 1000,
        slidePosition: 1,
        order: 0,
      },
    })
    const slideB = await prisma.carouselSlide.create({
      data: {
        projectId: projectBId,
        fileName: 'slide-b.jpg',
        filePath: '/test/slide-b.jpg',
        fileType: 'image',
        fileSize: 1000,
        slidePosition: 1,
        order: 0,
      },
    })

    slideAId = slideA.id
    slideBId = slideB.id

    // Create test texts
    const textA = await prisma.carouselText.create({
      data: {
        projectId: projectAId,
        content: 'Text A',
        slidePosition: 1,
        order: 0,
      },
    })
    const textB = await prisma.carouselText.create({
      data: {
        projectId: projectBId,
        content: 'Text B',
        slidePosition: 1,
        order: 0,
      },
    })

    textAId = textA.id
    textBId = textB.id
  })

  afterEach(async () => {
    // Cleanup in reverse order of dependencies
    await prisma.carouselText.deleteMany({})
    await prisma.carouselSlide.deleteMany({})
    await prisma.carouselProject.deleteMany({})
    await prisma.user.deleteMany({})
  })

  describe('Project Authorization', () => {
    test('should allow user to access their own project', async () => {
      await expect(
        authorizationService.verifyCarouselProjectOwnership(userAId, projectAId)
      ).resolves.not.toThrow()
    })

    test('should deny access to other users project', async () => {
      await expect(
        authorizationService.verifyCarouselProjectOwnership(userBId, projectAId)
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should return 404 for non-existent project', async () => {
      await expect(
        authorizationService.verifyCarouselProjectOwnership(userAId, 'non-existent-id')
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should get project with ownership check', async () => {
      const project = await authorizationService.getAuthorizedCarouselProject(userAId, projectAId)
      expect(project).toBeDefined()
      expect(project.id).toBe(projectAId)
      expect(project.userId).toBe(userAId)
    })

    test('should not leak project existence to unauthorized users', async () => {
      const error = await authorizationService
        .getAuthorizedCarouselProject(userBId, projectAId)
        .catch((e) => e)

      expect(error).toBeInstanceOf(ResourceNotFoundError)
      expect(error.statusCode).toBe(404)
      // Should not reveal that project exists
      expect(error.message).not.toContain('access denied')
      expect(error.message).not.toContain('unauthorized')
    })
  })

  describe('Slide Authorization', () => {
    test('should allow user to access their own slide', async () => {
      await expect(
        authorizationService.verifyCarouselSlideOwnership(userAId, slideAId)
      ).resolves.not.toThrow()
    })

    test('should deny access to other users slide', async () => {
      await expect(
        authorizationService.verifyCarouselSlideOwnership(userBId, slideAId)
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should return 404 for non-existent slide', async () => {
      await expect(
        authorizationService.verifyCarouselSlideOwnership(userAId, 'non-existent-id')
      ).rejects.toThrow(ResourceNotFoundError)
    })
  })

  describe('Text Authorization', () => {
    test('should allow user to access their own text', async () => {
      await expect(
        authorizationService.verifyCarouselTextOwnership(userAId, textAId)
      ).resolves.not.toThrow()
    })

    test('should deny access to other users text', async () => {
      await expect(
        authorizationService.verifyCarouselTextOwnership(userBId, textAId)
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should return 404 for non-existent text', async () => {
      await expect(
        authorizationService.verifyCarouselTextOwnership(userAId, 'non-existent-id')
      ).rejects.toThrow(ResourceNotFoundError)
    })
  })

  describe('Batch Operations', () => {
    test('should allow batch verification of owned resources', async () => {
      // User A has both slideAId and textAId
      await expect(
        authorizationService.verifyBatchOwnership(userAId, [slideAId], 'CarouselSlide')
      ).resolves.not.toThrow()
    })

    test('should deny batch verification if any resource is not owned', async () => {
      // User B trying to access both their slide and User A's slide
      await expect(
        authorizationService.verifyBatchOwnership(userBId, [slideBId, slideAId], 'CarouselSlide')
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should deny batch verification if any resource does not exist', async () => {
      await expect(
        authorizationService.verifyBatchOwnership(
          userAId,
          [slideAId, 'non-existent-id'],
          'CarouselSlide'
        )
      ).rejects.toThrow(ResourceNotFoundError)
    })
  })
})

describe('AuthorizationService - Video Mixer', () => {
  let userAId: string
  let userBId: string
  let projectAId: string
  let projectBId: string
  let groupAId: string
  let groupBId: string

  beforeEach(async () => {
    // Create test users
    const userA = await prisma.user.create({
      data: {
        email: 'usera-vm@test.com',
        passwordHash: 'hash',
        name: 'User A',
      },
    })
    const userB = await prisma.user.create({
      data: {
        email: 'userb-vm@test.com',
        passwordHash: 'hash',
        name: 'User B',
      },
    })

    userAId = userA.id
    userBId = userB.id

    // Create test projects
    const projectA = await prisma.videoMixerProject.create({
      data: {
        userId: userAId,
        name: 'Video Project A',
      },
    })
    const projectB = await prisma.videoMixerProject.create({
      data: {
        userId: userBId,
        name: 'Video Project B',
      },
    })

    projectAId = projectA.id
    projectBId = projectB.id

    // Create test groups
    const groupA = await prisma.videoMixerGroup.create({
      data: {
        projectId: projectAId,
        name: 'Group A',
        order: 0,
      },
    })
    const groupB = await prisma.videoMixerGroup.create({
      data: {
        projectId: projectBId,
        name: 'Group B',
        order: 0,
      },
    })

    groupAId = groupA.id
    groupBId = groupB.id
  })

  afterEach(async () => {
    // Cleanup
    await prisma.videoMixerGroup.deleteMany({})
    await prisma.videoMixerProject.deleteMany({})
    await prisma.user.deleteMany({
      where: {
        email: { in: ['usera-vm@test.com', 'userb-vm@test.com'] },
      },
    })
  })

  describe('Group Authorization', () => {
    test('should allow user to access their own group', async () => {
      await expect(
        authorizationService.verifyVideoMixerGroupOwnership(userAId, groupAId)
      ).resolves.not.toThrow()
    })

    test('should deny access to other users group', async () => {
      await expect(
        authorizationService.verifyVideoMixerGroupOwnership(userBId, groupAId)
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should return 404 for non-existent group', async () => {
      await expect(
        authorizationService.verifyVideoMixerGroupOwnership(userAId, 'non-existent-id')
      ).rejects.toThrow(ResourceNotFoundError)
    })

    test('should not leak group existence to unauthorized users', async () => {
      const error = await authorizationService
        .verifyVideoMixerGroupOwnership(userBId, groupAId)
        .catch((e) => e)

      expect(error).toBeInstanceOf(ResourceNotFoundError)
      expect(error.statusCode).toBe(404)
    })
  })
})

describe('Authorization Error Handling', () => {
  test('ResourceNotFoundError should have correct properties', () => {
    const error = new ResourceNotFoundError('CarouselProject', 'test-id')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ResourceNotFoundError')
    expect(error.statusCode).toBe(404)
    expect(error.resourceType).toBe('CarouselProject')
    expect(error.resourceId).toBe('test-id')
  })

  test('AuthorizationError should have correct properties', () => {
    const error = new AuthorizationError('CarouselProject', 'test-id')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AuthorizationError')
    expect(error.statusCode).toBe(403)
    expect(error.resourceType).toBe('CarouselProject')
    expect(error.resourceId).toBe('test-id')
  })

  test('ResourceNotFoundError.toJSON should not leak information', () => {
    const error = new ResourceNotFoundError('CarouselProject', 'test-id')
    const json = error.toJSON()

    expect(json.statusCode).toBe(404)
    expect(json.error).toBe('Not Found')
    expect(json.message).not.toContain('access')
    expect(json.message).not.toContain('unauthorized')
    // Should not include resourceId in JSON (information leakage)
    expect(json).not.toHaveProperty('resourceId')
  })
})

describe('Security Edge Cases', () => {
  test('should handle empty string IDs gracefully', async () => {
    await expect(
      authorizationService.verifyCarouselProjectOwnership('user-id', '')
    ).rejects.toThrow()
  })

  test('should handle null-like IDs gracefully', async () => {
    await expect(
      authorizationService.verifyCarouselProjectOwnership('user-id', null as any)
    ).rejects.toThrow()
  })

  test('should handle SQL injection attempts in IDs', async () => {
    const maliciousId = "'; DROP TABLE CarouselProject; --"
    await expect(
      authorizationService.verifyCarouselProjectOwnership('user-id', maliciousId)
    ).rejects.toThrow(ResourceNotFoundError)
  })

  test('should handle very long IDs', async () => {
    const longId = 'a'.repeat(10000)
    await expect(
      authorizationService.verifyCarouselProjectOwnership('user-id', longId)
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
