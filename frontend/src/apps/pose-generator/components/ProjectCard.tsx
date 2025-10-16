import { Folder, Image, Sparkles, Calendar, MoreVertical, Archive, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { PoseGeneratorProject } from '../types'
import { getAbsoluteImageUrl } from '../../../lib/api'

interface ProjectCardProps {
  project: PoseGeneratorProject
  onClick?: () => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ProjectCard({ project, onClick, onArchive, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const avatarUrl = getAbsoluteImageUrl(project.avatarImageUrl)

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Header with Avatar */}
      <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={project.projectName}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-slate-300" />
          </div>
        )}

        {/* Status Badge */}
        {project.status === 'archived' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-slate-800/80 text-white text-xs font-medium rounded">
            Archived
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow-sm"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
              {project.status === 'active' && onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive(project.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Are you sure you want to delete this project?')) {
                      onDelete(project.id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1 truncate">{project.projectName}</h3>

        {project.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{project.totalGenerations}</div>
              <div className="text-xs text-slate-600">Generations</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Image className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{project.totalPosesGenerated}</div>
              <div className="text-xs text-slate-600">Poses</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Folder className="w-3.5 h-3.5" />
            {project.avatarSource === 'AVATAR_CREATOR' ? 'Avatar Creator' : 'Upload'}
          </div>
        </div>
      </div>
    </div>
  )
}
