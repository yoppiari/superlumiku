import { useEffect, useRef, useState } from 'react'
import { Paintbrush, Eraser, Trash2 } from 'lucide-react'

interface InpaintCanvasProps {
  imageWidth: number
  imageHeight: number
  onMaskGenerated: (maskDataUrl: string) => void
}

export function InpaintCanvas({ imageWidth, imageHeight, onMaskGenerated }: InpaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(20)
  const [opacity, setOpacity] = useState(1.0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to match image
    canvas.width = imageWidth
    canvas.height = imageHeight

    // Initialize transparent canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [imageWidth, imageHeight])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // Generate mask and notify parent
    const canvas = canvasRef.current
    if (canvas) {
      const maskDataUrl = canvas.toDataURL('image/png')
      onMaskGenerated(maskDataUrl)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushSize

    if (tool === 'brush') {
      // Draw white on transparent (white = area to inpaint)
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    } else {
      // Eraser mode
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
    }

    // Draw point
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onMaskGenerated('')
    }
  }

  return (
    <div className="absolute inset-0 z-20">
      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="absolute inset-0 cursor-crosshair"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-4">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool('brush')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'brush'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Brush"
          >
            <Paintbrush className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Eraser"
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Clear All"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Brush Size */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        {tool === 'brush' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm text-slate-600 text-center">
          <span className="font-medium">Mark the area</span> you want to edit, then enter your prompt below
        </p>
      </div>
    </div>
  )
}
