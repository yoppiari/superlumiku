import { useNavigate, useParams } from 'react-router-dom'
import { Layers, FolderOpen } from 'lucide-react'

export function Sidebar() {
  const navigate = useNavigate()
  const { projectId } = useParams()

  const isInProject = !!projectId

  const navItems = [
    {
      id: 'bulk-generator',
      label: 'Bulk Generator',
      icon: Layers,
      isActive: isInProject,
      disabled: !isInProject,
      onClick: () => {
        // Already in project, no action needed
      }
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      isActive: !isInProject,
      disabled: false,
      onClick: () => {
        navigate('/apps/carousel-mix')
      }
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Carousel Mix</h2>
            <p className="text-xs text-gray-500">Workflow</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${item.isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${item.isActive ? 'text-blue-600' : ''}`} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {isInProject ? 'Editing project' : 'Select a project to start'}
        </div>
      </div>
    </div>
  )
}
