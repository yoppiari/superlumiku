import { useState } from 'react'
import { X, Edit2, Check } from 'lucide-react'
import { TextStylePresetSelector } from './TextStylePresetSelector'
import type { TextVariation, TextStyle } from '../../../stores/carouselMixStore'
import { useCarouselMixStore } from '../../../stores/carouselMixStore'

interface TextVariationItemProps {
  text: TextVariation
}

export function TextVariationItem({ text }: TextVariationItemProps) {
  const { updateTextVariation, deleteTextVariation } = useCarouselMixStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(text.content)
  const [editedStyle, setEditedStyle] = useState<TextStyle>(text.style)

  const handleSave = async () => {
    try {
      const fontWeight = editedStyle.fontWeight >= 600 ? 'bold' : 'normal'

      await updateTextVariation(text.id, {
        content: editedContent,
        style: {
          ...editedStyle,
          fontWeight: editedStyle.fontWeight, // Keep numeric for style
        },
        fontSize: editedStyle.fontSize,
        fontColor: editedStyle.color,
        fontWeight: fontWeight, // Use converted value for legacy field
      })
      setIsEditing(false)
    } catch (error: any) {
      alert(error.message || 'Failed to update text')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this text variation?')) return
    try {
      await deleteTextVariation(text.id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete text')
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-3 p-3 border border-blue-300 rounded-lg bg-blue-50">
        <TextStylePresetSelector onSelect={setEditedStyle} />

        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          rows={2}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!editedContent.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setEditedContent(text.content)
              setEditedStyle(text.style)
            }}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 group">
      <span className="text-sm text-gray-700 flex-1 truncate">
        {text.content}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
