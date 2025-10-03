import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '../lib/api'

// ===== Types =====

export interface Slide {
  id: string
  projectId: string
  slidePosition: number // NEW: Which position in carousel (1, 2, 3, ..., N)
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  width?: number
  height?: number
  thumbnail?: string
  order: number
  createdAt: string
}

export interface TextShadow {
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

export interface TextOutline {
  width: number
  color: string
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 300 | 400 | 500 | 700 | 900
  color: string
  backgroundColor?: string
  shadow?: TextShadow
  outline?: TextOutline
}

export interface TextPosition {
  preset: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'custom'
  x: number // percentage 0-100
  y: number // percentage 0-100
  align: 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'top' | 'middle' | 'bottom'
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface TextVariation {
  id: string
  projectId: string
  slidePosition: number // NEW: Which position in carousel (1, 2, 3, ..., N)
  content: string

  // New comprehensive styling
  style: TextStyle
  position: TextPosition

  // Legacy fields (kept for backward compatibility)
  fontSize: number
  fontColor: string
  fontWeight: string
  alignment: string

  order: number
  createdAt: string
}

export interface Generation {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  numSlides: number
  numSetsGenerated: number
  creditUsed: number
  outputPath?: string
  createdAt: string
  completedAt?: string
}

// Helper type for position-based grouping
export interface SlidesByPosition {
  [position: number]: Slide[]
}

export interface TextsByPosition {
  [position: number]: TextVariation[]
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  slides: Slide[]
  texts: TextVariation[]
  generations: Generation[]
  createdAt: string
  updatedAt: string
}

// Helper functions to group by position
export function groupSlidesByPosition(slides: Slide[]): SlidesByPosition {
  return slides.reduce((acc, slide) => {
    if (!acc[slide.slidePosition]) {
      acc[slide.slidePosition] = []
    }
    acc[slide.slidePosition].push(slide)
    return acc
  }, {} as SlidesByPosition)
}

export function groupTextsByPosition(texts: TextVariation[]): TextsByPosition {
  return texts.reduce((acc, text) => {
    if (!acc[text.slidePosition]) {
      acc[text.slidePosition] = []
    }
    acc[text.slidePosition].push(text)
    return acc
  }, {} as TextsByPosition)
}

export interface TextVariationSettings {
  algorithm: 'random' | 'sequential' | 'weighted'
  texts: string[]
  count: number
}

export interface GenerationSettings {
  numSlides: number
  numSets: number
  textVariation: TextVariationSettings
}

export interface CombinationEstimate {
  totalCombinations: number
  feasible: boolean
  reason?: string
  credits: {
    perSet: number
    total: number
  }
}

// ===== Helper Functions =====

/**
 * Calculate possible combinations for position-based carousel generation
 * Formula: Position1_variations × Position2_variations × ... × PositionN_variations
 * Where each position variation = images_count × (texts_count || 1)
 */
export function calculateCombinations(
  numSlides: number,
  slidesByPosition: SlidesByPosition,
  textsByPosition: TextsByPosition
): number {
  let total = 1

  for (let pos = 1; pos <= numSlides; pos++) {
    const imageCount = slidesByPosition[pos]?.length || 0
    const textCount = textsByPosition[pos]?.length || 0

    // If no images for this position, return 0 (can't generate)
    if (imageCount === 0) {
      return 0
    }

    // Variations = images × (texts OR 1 if no texts)
    const positionVariations = imageCount * Math.max(textCount, 1)
    total *= positionVariations
  }

  return total
}

/**
 * Get breakdown of combinations per position for display
 */
export function getCombinationBreakdown(
  numSlides: number,
  slidesByPosition: SlidesByPosition,
  textsByPosition: TextsByPosition
): Array<{ position: number; imageCount: number; textCount: number; variations: number }> {
  const breakdown = []

  for (let pos = 1; pos <= numSlides; pos++) {
    const imageCount = slidesByPosition[pos]?.length || 0
    const textCount = textsByPosition[pos]?.length || 0
    const variations = imageCount * Math.max(textCount, 1)

    breakdown.push({ position: pos, imageCount, textCount, variations })
  }

  return breakdown
}

// ===== Store State =====

interface CarouselMixState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  isLoadingProjects: boolean

  // UI State
  isDirty: boolean
  isUploading: boolean
  isGenerating: boolean
  isSaving: boolean
  lastSaved: Date | null

  // Generation Settings
  generationSettings: GenerationSettings
  combinationEstimate: CombinationEstimate | null

  // Actions - Projects
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  selectProject: (projectId: string) => Promise<void>
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  clearCurrentProject: () => void

  // Actions - Slides
  uploadSlide: (projectId: string, file: File, slidePosition: number) => Promise<Slide>
  deleteSlide: (slideId: string) => Promise<void>
  reorderSlides: (slideIds: string[]) => void

  // Actions - Text Variations
  addTextVariation: (projectId: string, text: Partial<TextVariation>) => Promise<TextVariation>
  updateTextVariation: (textId: string, data: Partial<TextVariation>) => Promise<void>
  deleteTextVariation: (textId: string) => Promise<void>

  // Actions - Generation
  updateGenerationSettings: (settings: Partial<GenerationSettings>) => void
  calculateCombinations: (projectId: string) => Promise<CombinationEstimate>
  generateCarousels: (projectId: string) => Promise<Generation>

  // Actions - Utility
  markDirty: () => void
  markClean: () => void
  reset: () => void
}

// ===== Initial State =====

const initialGenerationSettings: GenerationSettings = {
  numSlides: 4,
  numSets: 5,
  textVariation: {
    algorithm: 'sequential',
    texts: [],
    count: 1,
  },
}

// ===== Store =====

export const useCarouselMixStore = create<CarouselMixState>()(
  immer((set, get) => ({
    // Initial State
    projects: [],
    currentProject: null,
    isLoadingProjects: false,
    isDirty: false,
    isUploading: false,
    isGenerating: false,
    isSaving: false,
    lastSaved: null,
    generationSettings: initialGenerationSettings,
    combinationEstimate: null,

    // ===== Projects Actions =====

    loadProjects: async () => {
      set((state) => {
        state.isLoadingProjects = true
      })

      try {
        const res = await api.get('/api/apps/carousel-mix/projects')
        set((state) => {
          state.projects = res.data.projects
          state.isLoadingProjects = false
        })
      } catch (error) {
        console.error('Failed to load projects:', error)
        set((state) => {
          state.isLoadingProjects = false
        })
        throw error
      }
    },

    createProject: async (name: string, description?: string) => {
      try {
        const res = await api.post('/api/apps/carousel-mix/projects', {
          name,
          description,
        })

        const newProject = res.data.project

        set((state) => {
          state.projects.unshift(newProject)
        })

        return newProject
      } catch (error) {
        console.error('Failed to create project:', error)
        throw error
      }
    },

    selectProject: async (projectId: string) => {
      try {
        const res = await api.get(`/api/apps/carousel-mix/projects/${projectId}`)

        set((state) => {
          state.currentProject = res.data.project
          state.isDirty = false
        })
      } catch (error) {
        console.error('Failed to load project:', error)
        throw error
      }
    },

    updateProject: async (projectId: string, data: { name?: string; description?: string }) => {
      try {
        await api.put(`/api/apps/carousel-mix/projects/${projectId}`, data)

        set((state) => {
          // Update in projects list
          const projectIndex = state.projects.findIndex((p) => p.id === projectId)
          if (projectIndex !== -1) {
            if (data.name !== undefined) state.projects[projectIndex].name = data.name
            if (data.description !== undefined) state.projects[projectIndex].description = data.description
          }

          // Update current project if it's the same
          if (state.currentProject?.id === projectId) {
            if (data.name !== undefined) state.currentProject.name = data.name
            if (data.description !== undefined) state.currentProject.description = data.description
          }

          state.markClean()
        })
      } catch (error) {
        console.error('Failed to update project:', error)
        throw error
      }
    },

    deleteProject: async (projectId: string) => {
      try {
        await api.delete(`/api/apps/carousel-mix/projects/${projectId}`)

        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== projectId)
          if (state.currentProject?.id === projectId) {
            state.currentProject = null
          }
        })
      } catch (error) {
        console.error('Failed to delete project:', error)
        throw error
      }
    },

    clearCurrentProject: () => {
      set((state) => {
        state.currentProject = null
        state.isDirty = false
        state.combinationEstimate = null
      })
    },

    // ===== Slides Actions =====

    uploadSlide: async (projectId: string, file: File, slidePosition: number) => {
      set((state) => {
        state.isUploading = true
        state.isSaving = true
      })

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('slidePosition', String(slidePosition)) // NEW: Pass slidePosition to backend

        const res = await api.post(
          `/api/apps/carousel-mix/projects/${projectId}/slides/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        const newSlide = res.data.slide

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.slides.push(newSlide)
          }
          state.isUploading = false
          state.isSaving = false
          state.lastSaved = new Date()
          state.markDirty()
        })

        return newSlide
      } catch (error) {
        set((state) => {
          state.isUploading = false
          state.isSaving = false
        })
        console.error('Failed to upload slide:', error)
        throw error
      }
    },

    deleteSlide: async (slideId: string) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.delete(`/api/apps/carousel-mix/slides/${slideId}`)

        set((state) => {
          if (state.currentProject) {
            state.currentProject.slides = state.currentProject.slides.filter(
              (s) => s.id !== slideId
            )
            state.markDirty()
          }
          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to delete slide:', error)
        throw error
      }
    },

    reorderSlides: (slideIds: string[]) => {
      set((state) => {
        if (state.currentProject) {
          const reordered = slideIds
            .map((id) => state.currentProject!.slides.find((s) => s.id === id))
            .filter(Boolean) as Slide[]

          state.currentProject.slides = reordered.map((slide, index) => ({
            ...slide,
            order: index,
          }))

          state.markDirty()
        }
      })
    },

    // ===== Text Variations Actions =====

    addTextVariation: async (projectId: string, text: Partial<TextVariation>) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        const res = await api.post(`/api/apps/carousel-mix/projects/${projectId}/texts`, text)

        const newText = res.data.text

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.texts.push(newText)
          }
          state.isSaving = false
          state.lastSaved = new Date()
          state.markDirty()
        })

        return newText
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to add text variation:', error)
        throw error
      }
    },

    updateTextVariation: async (textId: string, data: Partial<TextVariation>) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.put(`/api/apps/carousel-mix/texts/${textId}`, data)

        set((state) => {
          if (state.currentProject) {
            const textIndex = state.currentProject.texts.findIndex((t) => t.id === textId)
            if (textIndex !== -1) {
              state.currentProject.texts[textIndex] = {
                ...state.currentProject.texts[textIndex],
                ...data,
              }
            }
            state.markDirty()
          }
          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to update text variation:', error)
        throw error
      }
    },

    deleteTextVariation: async (textId: string) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.delete(`/api/apps/carousel-mix/texts/${textId}`)

        set((state) => {
          if (state.currentProject) {
            state.currentProject.texts = state.currentProject.texts.filter(
              (t) => t.id !== textId
            )
            state.markDirty()
          }
          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to delete text variation:', error)
        throw error
      }
    },

    // ===== Generation Actions =====

    updateGenerationSettings: (settings: Partial<GenerationSettings>) => {
      set((state) => {
        state.generationSettings = {
          ...state.generationSettings,
          ...settings,
        }
        state.combinationEstimate = null // Invalidate estimate when settings change
      })
    },

    calculateCombinations: async (projectId: string) => {
      try {
        const settings = get().generationSettings
        const res = await api.get(
          `/api/apps/carousel-mix/projects/${projectId}/combinations`,
          {
            params: {
              numSlides: settings.numSlides,
              numSets: settings.numSets,
            },
          }
        )

        const estimate = res.data.data

        set((state) => {
          state.combinationEstimate = {
            totalCombinations: estimate.totalCombinations,
            feasible: estimate.feasibility.feasible,
            reason: estimate.feasibility.reason,
            credits: estimate.credits,
          }
        })

        return estimate
      } catch (error) {
        console.error('Failed to calculate combinations:', error)
        throw error
      }
    },

    generateCarousels: async (projectId: string) => {
      set((state) => {
        state.isGenerating = true
      })

      try {
        const settings = get().generationSettings
        const res = await api.post(`/api/apps/carousel-mix/projects/${projectId}/generate`, {
          numSlides: settings.numSlides,
          numSets: settings.numSets,
        })

        const generation = res.data.generation

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.generations.unshift(generation)
          }
          state.isGenerating = false
        })

        return generation
      } catch (error) {
        set((state) => {
          state.isGenerating = false
        })
        console.error('Failed to generate carousels:', error)
        throw error
      }
    },

    // ===== Utility Actions =====

    markDirty: () => {
      set((state) => {
        state.isDirty = true
      })
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false
      })
    },

    reset: () => {
      set((state) => {
        state.projects = []
        state.currentProject = null
        state.isDirty = false
        state.isUploading = false
        state.isGenerating = false
        state.generationSettings = initialGenerationSettings
        state.combinationEstimate = null
      })
    },
  }))
)

