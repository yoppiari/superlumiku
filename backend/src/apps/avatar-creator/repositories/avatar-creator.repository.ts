import { prisma } from '../../../db/client'
import type {
  AvatarProject,
  Avatar,
  AvatarPreset,
  PersonaExample,
  AvatarUsageHistory,
  AvatarGeneration,
} from '../types'

/**
 * Avatar Creator Repository
 *
 * Data access layer for all avatar-related database operations
 * Follows repository pattern used in other Lumiku apps
 */

// ========================================
// Project Queries
// ========================================

export async function findProjectsByUserId(userId: string): Promise<AvatarProject[]> {
  return prisma.avatarProject.findMany({
    where: { userId },
    include: {
      avatars: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findProjectById(projectId: string, userId: string): Promise<AvatarProject | null> {
  return prisma.avatarProject.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      avatars: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function createProject(data: {
  userId: string
  name: string
  description?: string
}): Promise<AvatarProject> {
  return prisma.avatarProject.create({
    data: {
      userId: data.userId,
      name: data.name,
      description: data.description || null,
    },
    include: {
      avatars: true,
    },
  })
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: {
    name?: string
    description?: string
  }
): Promise<AvatarProject> {
  return prisma.avatarProject.update({
    where: {
      id: projectId,
      userId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  })
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  await prisma.avatarProject.delete({
    where: {
      id: projectId,
      userId,
    },
  })
}

// ========================================
// Avatar Queries
// ========================================

export async function findAvatarById(avatarId: string, userId: string): Promise<Avatar | null> {
  return prisma.avatar.findFirst({
    where: {
      id: avatarId,
      userId,
    },
    include: {
      project: true,
    },
  })
}

export async function findAvatarsByProjectId(projectId: string, userId: string): Promise<Avatar[]> {
  return prisma.avatar.findMany({
    where: {
      projectId,
      userId,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findAvatarsByUserId(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ avatars: Avatar[]; total: number }> {
  const [avatars, total] = await Promise.all([
    prisma.avatar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        project: true,
      },
    }),
    prisma.avatar.count({
      where: { userId },
    }),
  ])

  return { avatars, total }
}

export async function createAvatar(data: {
  userId: string
  projectId: string
  name: string
  baseImageUrl: string
  thumbnailUrl?: string
  sourceType: string
  generationPrompt?: string
  seedUsed?: number
  // Persona
  personaName?: string
  personaAge?: number
  personaPersonality?: string
  personaBackground?: string
  // Visual attributes
  gender?: string
  ageRange?: string
  ethnicity?: string
  bodyType?: string
  hairStyle?: string
  hairColor?: string
  eyeColor?: string
  skinTone?: string
  style?: string
}): Promise<Avatar> {
  return prisma.avatar.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      name: data.name,
      baseImageUrl: data.baseImageUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      sourceType: data.sourceType,
      generationPrompt: data.generationPrompt || null,
      seedUsed: data.seedUsed || null,
      // Persona
      personaName: data.personaName || null,
      personaAge: data.personaAge || null,
      personaPersonality: data.personaPersonality || null,
      personaBackground: data.personaBackground || null,
      // Visual attributes
      gender: data.gender || null,
      ageRange: data.ageRange || null,
      ethnicity: data.ethnicity || null,
      bodyType: data.bodyType || null,
      hairStyle: data.hairStyle || null,
      hairColor: data.hairColor || null,
      eyeColor: data.eyeColor || null,
      skinTone: data.skinTone || null,
      style: data.style || null,
    },
    include: {
      project: true,
    },
  })
}

export async function updateAvatar(
  avatarId: string,
  userId: string,
  data: Partial<{
    name: string
    baseImageUrl: string
    thumbnailUrl: string
    // Persona
    personaName: string
    personaAge: number
    personaPersonality: string
    personaBackground: string
    // Visual attributes
    gender: string
    ageRange: string
    ethnicity: string
    bodyType: string
    hairStyle: string
    hairColor: string
    eyeColor: string
    skinTone: string
    style: string
  }>
): Promise<Avatar> {
  return prisma.avatar.update({
    where: {
      id: avatarId,
      userId,
    },
    data,
  })
}

export async function deleteAvatar(avatarId: string, userId: string): Promise<void> {
  await prisma.avatar.delete({
    where: {
      id: avatarId,
      userId,
    },
  })
}

export async function incrementAvatarUsage(avatarId: string): Promise<void> {
  await prisma.avatar.update({
    where: { id: avatarId },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  })
}

// ========================================
// Preset Queries
// ========================================

export async function findAllPresets(category?: string): Promise<AvatarPreset[]> {
  return prisma.avatarPreset.findMany({
    where: {
      isPublic: true,
      ...(category && { category }),
    },
    orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function findPresetById(presetId: string): Promise<AvatarPreset | null> {
  return prisma.avatarPreset.findUnique({
    where: { id: presetId },
  })
}

export async function incrementPresetUsage(presetId: string): Promise<void> {
  await prisma.avatarPreset.update({
    where: { id: presetId },
    data: {
      usageCount: { increment: 1 },
    },
  })
}

// ========================================
// Persona Example Queries
// ========================================

export async function findAllPersonaExamples(category?: string): Promise<PersonaExample[]> {
  return prisma.personaExample.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function findPersonaExampleById(exampleId: string): Promise<PersonaExample | null> {
  return prisma.personaExample.findUnique({
    where: { id: exampleId },
  })
}

// ========================================
// Usage History Queries
// ========================================

export async function createUsageHistory(data: {
  avatarId: string
  userId: string
  appId: string
  appName: string
  action: string
  referenceId?: string
  referenceType?: string
  metadata?: string
}): Promise<AvatarUsageHistory> {
  return prisma.avatarUsageHistory.create({
    data: {
      avatarId: data.avatarId,
      userId: data.userId,
      appId: data.appId,
      appName: data.appName,
      action: data.action,
      referenceId: data.referenceId || null,
      referenceType: data.referenceType || null,
      metadata: data.metadata || null,
    },
  })
}

export async function findUsageHistoryByAvatarId(
  avatarId: string,
  userId: string,
  limit: number = 50
): Promise<AvatarUsageHistory[]> {
  return prisma.avatarUsageHistory.findMany({
    where: {
      avatarId,
      userId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getUsageSummaryByAvatarId(avatarId: string, userId: string) {
  const history = await prisma.avatarUsageHistory.groupBy({
    by: ['appId', 'appName'],
    where: {
      avatarId,
      userId,
    },
    _count: {
      id: true,
    },
    _max: {
      createdAt: true,
    },
  })

  return history.map((item) => ({
    appId: item.appId,
    appName: item.appName,
    count: item._count.id,
    lastUsed: item._max.createdAt,
  }))
}

// ========================================
// Generation Queries
// ========================================

export async function createGeneration(data: {
  userId: string
  projectId: string
  prompt: string
  options?: string
}): Promise<AvatarGeneration> {
  return prisma.avatarGeneration.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      prompt: data.prompt,
      options: data.options || null,
      status: 'pending',
    },
  })
}

export async function updateGenerationStatus(
  generationId: string,
  status: 'processing' | 'completed' | 'failed',
  data?: {
    avatarId?: string
    errorMessage?: string
  }
): Promise<AvatarGeneration> {
  return prisma.avatarGeneration.update({
    where: { id: generationId },
    data: {
      status,
      avatarId: data?.avatarId,
      errorMessage: data?.errorMessage,
      ...(status === 'completed' || status === 'failed'
        ? { completedAt: new Date() }
        : {}),
    },
  })
}

export async function findGenerationById(generationId: string): Promise<AvatarGeneration | null> {
  return prisma.avatarGeneration.findUnique({
    where: { id: generationId },
  })
}

// ========================================
// Stats Queries
// ========================================

export async function getUserStats(userId: string) {
  const [totalAvatars, totalProjects, recentUploads, usageData] = await Promise.all([
    prisma.avatar.count({ where: { userId } }),
    prisma.avatarProject.count({ where: { userId } }),
    prisma.avatar.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
    prisma.avatar.aggregate({
      where: { userId },
      _sum: { usageCount: true },
      _avg: { usageCount: true },
    }),
  ])

  const topUsedAvatars = await prisma.avatar.findMany({
    where: { userId },
    orderBy: { usageCount: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      usageCount: true,
    },
  })

  return {
    totalAvatars,
    totalProjects,
    recentUploads,
    totalUsage: usageData._sum.usageCount || 0,
    averageUsage: Math.round(usageData._avg.usageCount || 0),
    topUsedAvatars,
  }
}
