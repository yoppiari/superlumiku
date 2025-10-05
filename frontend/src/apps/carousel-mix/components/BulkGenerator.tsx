import { useCarouselMixStore } from '../../../stores/carouselMixStore'
import { InputPanel } from './InputPanel'
import { ResultsPanel } from './ResultsPanel'

interface BulkGeneratorProps {
  projectId: string
}

export function BulkGenerator({ projectId }: BulkGeneratorProps) {
  const { currentProject } = useCarouselMixStore()

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Input Materials */}
      <div className="flex-1 lg:w-1/2">
        <InputPanel projectId={projectId} />
      </div>

      {/* Right Panel: Results & Preview */}
      <div className="flex-1 lg:w-1/2">
        <ResultsPanel projectId={projectId} />
      </div>
    </div>
  )
}
