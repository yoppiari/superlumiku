import { useState, useRef } from 'react'
import { X, Check } from 'lucide-react'
import type { Annotation } from '../types/annotation'

interface AnnotateCanvasProps {
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
}

export function AnnotateCanvas({
  annotations,
  onAnnotationsChange
}: AnnotateCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null) // Track which annotation to show details

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't add if clicking on existing annotation
    if ((e.target as HTMLElement).closest('.annotation-marker')) {
      return
    }

    // Close any open details box
    setSelectedId(null)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate percentage position
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    // Create new annotation with SAM mode
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      x,
      y,
      xPercent,
      yPercent,
      prompt: '',
      maskRadius: 50, // Default 50px radius (fallback)
      segmentationMode: 'sam', // Always use SAM for smart detection
      status: 'editing'
    }

    setEditingId(newAnnotation.id)
    setEditingPrompt('')
    onAnnotationsChange([...annotations, newAnnotation])
  }

  const handleSaveAnnotation = (id: string) => {
    const updatedAnnotations = annotations.map(ann =>
      ann.id === id
        ? { ...ann, prompt: editingPrompt, status: 'ready' as const }
        : ann
    )
    onAnnotationsChange(updatedAnnotations)
    setEditingId(null)
    setEditingPrompt('')
    setSelectedId(null) // Close the box after save
  }

  const handleCancelAnnotation = (id: string) => {
    // Remove if no prompt entered
    const ann = annotations.find(a => a.id === id)
    if (!ann?.prompt) {
      onAnnotationsChange(annotations.filter(a => a.id !== id))
    }
    setEditingId(null)
    setEditingPrompt('')
    setSelectedId(null) // Close the box after cancel
  }

  const handleDeleteAnnotation = (id: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== id))
    setSelectedId(null) // Close the box after delete
  }

  const startEditing = (ann: Annotation) => {
    setEditingId(ann.id)
    setEditingPrompt(ann.prompt)
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 z-20 cursor-crosshair"
      onClick={handleCanvasClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      {/* Annotations */}
      {annotations.map((ann, index) => {
        const isEditing = editingId === ann.id

        return (
          <div
            key={ann.id}
            className="annotation-marker absolute"
            style={{
              left: `${ann.xPercent}%`,
              top: `${ann.yPercent}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Mask Preview Circle */}
            <div
              className="absolute border-2 border-purple-500 rounded-full bg-purple-500/20 pointer-events-none"
              style={{
                width: `${ann.maskRadius * 2}px`,
                height: `${ann.maskRadius * 2}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />

            {/* Annotation Number Badge - Clickable */}
            <div
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10 cursor-pointer hover:bg-purple-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Toggle selection: if already selected, deselect; otherwise select
                setSelectedId(selectedId === ann.id ? null : ann.id)
              }}
            >
              {index + 1}
            </div>

            {/* Floating Prompt Box - Only show when editing OR when selected */}
            {(isEditing || selectedId === ann.id) && (
              <div
                className={`absolute left-1/2 transform -translate-x-1/2 min-w-[320px] max-w-[400px] bg-white rounded-lg shadow-2xl border-2 border-purple-300 z-50 ${
                  ann.yPercent < 40 ? 'top-full mt-4' : 'bottom-full mb-4'
                }`}
                style={{
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(8px)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  // Edit Mode
                  <div className="p-3">
                    <textarea
                      value={editingPrompt}
                      onChange={(e) => setEditingPrompt(e.target.value)}
                      placeholder="Describe what to edit here..."
                      rows={3}
                      autoFocus
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    />

                    {/* SAM Smart Detection Info */}
                    <div className="mt-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">✨</span>
                        <p className="text-xs font-medium text-purple-700">
                          Smart Detection Active
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        AI will detect the full object automatically
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveAnnotation(ann.id)}
                        disabled={!editingPrompt.trim()}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => handleCancelAnnotation(ann.id)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="p-3">
                    <p className="text-sm text-slate-900 mb-2">{ann.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-purple-600">✨</span>
                        Smart Detection
                      </span>
                      {ann.status === 'ready' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Ready</span>
                      )}
                      {ann.status === 'processing' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Processing...</span>
                      )}
                      {ann.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">✓ Done</span>
                      )}
                      {ann.status === 'failed' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Failed</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(ann)}
                        disabled={ann.status === 'processing'}
                        className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAnnotation(ann.id)}
                        disabled={ann.status === 'processing'}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 pointer-events-none">
        <p className="text-sm text-slate-600 text-center">
          <span className="font-medium">Click on image</span> to add annotation • <span className="font-medium">{annotations.length}</span> annotation{annotations.length !== 1 ? 's' : ''} added
        </p>
      </div>
    </div>
  )
}
