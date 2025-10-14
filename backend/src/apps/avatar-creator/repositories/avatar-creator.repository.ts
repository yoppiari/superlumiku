import prisma from '../../../db/client'
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
  const projects = await prisma.avatarProject.findMany({
    where: { userId },
    include: {
      avatars: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return projects as AvatarProject[]
}

export async function findProjectById(projectId: string, userId: string): Promise<AvatarProject | null> {
  const project = await prisma.avatarProject.findFirst({
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
  return project as AvatarProject | null
}

export async function createProject(data: {
  userId: string
  name: string
  description?: string
}): Promise<AvatarProject> {
  const project = await prisma.avatarProject.create({
    data: {
      userId: data.userId,
      name: data.name,
      description: data.description || null,
    },
    include: {
      avatars: true,
    },
  })
  return project as AvatarProject
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: {
    name?: string
    description?: string
  }
): Promise<AvatarProject> {
  const project = await prisma.avatarProject.update({
    where: {
      id: projectId,
      userId,
    },
    data: {
      name: data.name,
      description: data.description,
    },
  })
  return project as AvatarProject
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
  const avatar = await prisma.avatar.findFirst({
    where: {
      id: avatarId,
      userId,
    },
    include: {
      project: true,
    },
  })
  return avatar as Avatar | null
}

export async function findAvatarsByProjectId(projectId: string, userId: string): Promise<Avatar[]> {
  const avatars = await prisma.avatar.findMany({
    where: {
      projectId,
      userId,
    },
    orderBy: { createdAt: 'desc' },
  })
  return avatars as Avatar[]
}

export async function findAvatarsByUserId(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ avatars: Avatar[]; total: number }> {
  const [avatarsData, total] = await Promise.all([
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

  return { avatars: avatarsData as Avatar[], total }
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
  const avatar = await prisma.avatar.create({
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
  return avatar as Avatar
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
  const avatar = await prisma.avatar.update({
    where: {
      id: avatarId,
      userId,
    },
    data,
  })
  return avatar as Avatar
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
  const presets = await prisma.avatarPreset.findMany({
    where: {
      isPublic: true,
      ...(category && { category }),
    },
    orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
  })
  return presets as AvatarPreset[]
}

export async function findPresetById(presetId: string): Promise<AvatarPreset | null> {
  const preset = await prisma.avatarPreset.findUnique({
    where: { id: presetId },
  })
  return preset as AvatarPreset | null
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
  const examples = await prisma.personaExample.findMany({
    where: {
      isActive: true,
      ...(category && { category }),
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  })
  return examples as PersonaExample[]
}

export async function findPersonaExampleById(exampleId: string): Promise<PersonaExample | null> {
  const example = await prisma.personaExample.findUnique({
    where: { id: exampleId },
  })
  return example as PersonaExample | null
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
  const history = await prisma.avatarUsageHistory.create({
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
  return history as AvatarUsageHistory
}

export async function findUsageHistoryByAvatarId(
  avatarId: string,
  userId: string,
  limit: number = 50
): Promise<AvatarUsageHistory[]> {
  const history = await prisma.avatarUsageHistory.findMany({
    where: {
      avatarId,
      userId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return history as AvatarUsageHistory[]
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
  const generation = await prisma.avatarGeneration.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      prompt: data.prompt,
      options: data.options || null,
      status: 'pending',
    },
  })
  return generation as AvatarGeneration
}

export async function updateGenerationStatus(
  generationId: string,
  status: 'processing' | 'completed' | 'failed',
  data?: {
    avatarId?: string
    errorMessage?: string
  }
): Promise<AvatarGeneration> {
  const generation = await prisma.avatarGeneration.update({
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
  return generation as AvatarGeneration
}

export async function findGenerationById(generationId: string): Promise<AvatarGeneration | null> {
  const generation = await prisma.avatarGeneration.findUnique({
    where: { id: generationId },
  })
  return generation as AvatarGeneration | null
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
