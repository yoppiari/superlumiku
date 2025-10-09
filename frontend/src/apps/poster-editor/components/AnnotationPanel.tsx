import { Loader2, Trash2, MapPin } from 'lucide-react'
import type { Annotation } from '../types/annotation'

interface AnnotationPanelProps {
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  onProcessAll: () => void
  isProcessing: boolean
}

export function AnnotationPanel({
  annotations,
  onAnnotationsChange,
  onProcessAll,
  isProcessing
}: AnnotationPanelProps) {
  const totalCredits = annotations.length * 400

  const handleDeleteAnnotation = (id: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== id))
  }

  const handleClearAll = () => {
    if (confirm('Clear all annotations?')) {
      onAnnotationsChange([])
    }
  }

  const readyAnnotations = annotations.filter(a => a.status === 'ready')
  const processingAnnotations = annotations.filter(a => a.status === 'processing')
  const completedAnnotations = annotations.filter(a => a.status === 'completed')

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-slate-900">Annotations</h3>
        </div>
        {annotations.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isProcessing}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      {annotations.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No annotations yet</p>
          <p className="text-xs mt-1">Click on the image to add annotations</p>
        </div>
      ) : (
        <>
          {/* Annotations List */}
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
            {annotations.map((ann, index) => (
              <div
                key={ann.id}
                className={`border rounded-lg p-3 transition-colors ${
                  ann.status === 'editing'
                    ? 'border-amber-300 bg-amber-50'
                    : ann.status === 'ready'
                    ? 'border-purple-300 bg-purple-50'
                    : ann.status === 'processing'
                    ? 'border-blue-300 bg-blue-50'
                    : ann.status === 'completed'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium mb-1 break-words">
                      {ann.prompt || <span className="text-slate-400 italic">No prompt</span>}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Position: ({Math.round(ann.xPercent)}%, {Math.round(ann.yPercent)}%)</span>
                      <span>•</span>
                      <span>Radius: {ann.maskRadius}px</span>
                    </div>
                    <div className="mt-2">
                      {ann.status === 'editing' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Editing...
                        </span>
                      )}
                      {ann.status === 'ready' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Ready
                        </span>
                      )}
                      {ann.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </span>
                      )}
                      {ann.status === 'completed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      )}
                      {ann.status === 'failed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          ✕ Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  {ann.status !== 'processing' && (
                    <button
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      disabled={isProcessing}
                      className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete annotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary & Action */}
          <div className="border-t border-slate-200 pt-4">
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Total Annotations:</span>
                <span className="font-semibold text-slate-900">{annotations.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Ready to Process:</span>
                <span className="font-semibold text-purple-700">{readyAnnotations.length}</span>
              </div>
              {processingAnnotations.length > 0 && (
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Processing:</span>
                  <span className="font-semibold text-blue-700">{processingAnnotations.length}</span>
                </div>
              )}
              {completedAnnotations.length > 0 && (
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Completed:</span>
                  <span className="font-semibold text-green-700">{completedAnnotations.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                <span className="text-slate-600">Total Cost:</span>
                <span className="font-bold text-slate-900">{totalCredits.toLocaleString()} credits</span>
              </div>
            </div>

            {/* Process All Button */}
            <button
              onClick={onProcessAll}
              disabled={isProcessing || readyAnnotations.length === 0}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing {processingAnnotations.length} of {annotations.length}...
                </>
              ) : (
                <>
                  Process All ({readyAnnotations.length} annotations)
                </>
              )}
            </button>

            {readyAnnotations.length === 0 && annotations.length > 0 && !isProcessing && (
              <p className="text-xs text-slate-500 text-center mt-2">
                All annotations have been processed or are still being edited
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
