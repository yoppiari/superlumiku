import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { InpaintCanvas } from './InpaintCanvas'
import { AnnotateCanvas } from './AnnotateCanvas'
import type { Annotation } from '../types/annotation'

interface EditorCanvasProps {
  imageUrl?: string
  detectedTexts?: Array<{
    x: number
    y: number
    width: number
    height: number
    text: string
    confidence?: number
  }>
  onTextClick?: (index: number) => void
  inpaintMode?: boolean
  inpaintModeType?: 'brush' | 'annotate'
  onMaskGenerated?: (maskDataUrl: string) => void
  annotations?: Annotation[]
  onAnnotationsChange?: (annotations: Annotation[]) => void
}

export function EditorCanvas({ imageUrl, detectedTexts = [], onTextClick, inpaintMode = false, inpaintModeType = 'brush', onMaskGenerated, annotations = [], onAnnotationsChange }: EditorCanvasProps) {
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 400))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10))
  const handleFitToScreen = () => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
  }

  // Track image dimensions when it loads
  useEffect(() => {
    const img = imageRef.current
    if (img && img.complete) {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }, [imageUrl])

  const handleImageLoad = () => {
    const img = imageRef.current
    if (img) {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (inpaintMode) return // Disable panning in inpaint mode
    if (e.button === 0) { // Left click
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (inpaintMode) return // Disable panning in inpaint mode
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = () => {
    if (inpaintMode) return // Disable panning in inpaint mode
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (inpaintMode) return // Disable zoom in inpaint mode
    e.preventDefault()
    const delta = e.deltaY > 0 ? -10 : 10
    setZoom(prev => Math.max(10, Math.min(400, prev + delta)))
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!inpaintMode && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-2" />
              <button
                onClick={handleFitToScreen}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-700"
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          )}
          {inpaintMode && (
            <span className="text-sm font-medium text-purple-700">
              {inpaintModeType === 'brush' ? '🎨 Brush Mode - Draw mask on area to edit' : '👆 Quick Edit Mode - Click on areas to annotate'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          {!inpaintMode && (
            <>
              <Move className="w-4 h-4" />
              <span>Drag to pan</span>
            </>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden bg-slate-100 relative"
        style={{
          cursor: inpaintMode ? 'default' : (isPanning ? 'grabbing' : 'grab'),
          backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
          }}
        >
          {imageUrl ? (
            <div className="relative" style={{ minWidth: '100px', minHeight: '100px' }}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Poster"
                className="block w-auto h-auto max-w-[90vw] max-h-[80vh] object-contain shadow-2xl"
                draggable={false}
                onLoad={handleImageLoad}
              />

              {/* Text Detection Overlays (hide in inpaint mode) */}
              {!inpaintMode && detectedTexts.map((textBox, index) => (
                <div
                  key={index}
                  className="absolute border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 cursor-pointer transition-colors group"
                  style={{
                    left: `${textBox.x}%`,
                    top: `${textBox.y}%`,
                    width: `${textBox.width}%`,
                    height: `${textBox.height}%`
                  }}
                  onClick={() => onTextClick?.(index)}
                >
                  <div className="absolute -top-6 left-0 bg-green-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {textBox.text || 'Click to edit'}
                  </div>
                </div>
              ))}

              {/* Inpaint Canvas Overlay */}
              {inpaintMode && imageDimensions.width > 0 && (
                inpaintModeType === 'brush' && onMaskGenerated ? (
                  <InpaintCanvas
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    onMaskGenerated={onMaskGenerated}
                  />
                ) : inpaintModeType === 'annotate' && onAnnotationsChange ? (
                  <AnnotateCanvas
                    annotations={annotations}
                    onAnnotationsChange={onAnnotationsChange}
                  />
                ) : null
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-200 rounded-xl flex items-center justify-center">
                <Move className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium">No image uploaded</p>
              <p className="text-sm">Upload a poster to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      {imageUrl && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
          <span>Pan: {Math.round(pan.x)}px, {Math.round(pan.y)}px</span>
          <span>{detectedTexts.length} text regions detected</span>
        </div>
      )}
    </div>
  )
}
