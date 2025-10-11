import { avatarProjectRepository } from '../repositories/avatar-project.repository'
import { AvatarProject, CreateProjectRequest, UpdateProjectRequest } from '../types'

export class AvatarProjectService {
  /**
   * Get all projects for user
   */
  async getUserProjects(userId: string): Promise<AvatarProject[]> {
    return avatarProjectRepository.findByUserId(userId)
  }

  /**
   * Get single project with avatars
   */
  async getProject(projectId: string, userId: string): Promise<AvatarProject | null> {
    return avatarProjectRepository.findById(projectId, userId)
  }

  /**
   * Create new project
   */
  async createProject(userId: string, data: CreateProjectRequest): Promise<AvatarProject> {
    return avatarProjectRepository.create(userId, data.name, data.description)
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<AvatarProject> {
    // Verify ownership
    const project = await avatarProjectRepository.findById(projectId, userId)
    if (!project) {
      throw new Error('Project not found')
    }

    return avatarProjectRepository.update(projectId, userId, data)
  }

  /**
   * Delete project (cascade deletes avatars)
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Verify ownership
    const project = await avatarProjectRepository.findById(projectId, userId)
    if (!project) {
      throw new Error('Project not found')
    }

    await avatarProjectRepository.delete(projectId, userId)
  }
}

export const avatarProjectService = new AvatarProjectService()
