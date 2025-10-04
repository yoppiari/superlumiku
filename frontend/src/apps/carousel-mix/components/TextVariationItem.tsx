import { X } from 'lucide-react'
import type { TextVariation } from '../../../stores/carouselMixStore'
import { useCarouselMixStore } from '../../../stores/carouselMixStore'

interface TextVariationItemProps {
  text: TextVariation
}

export function TextVariationItem({ text }: TextVariationItemProps) {
  const { deleteTextVariation } = useCarouselMixStore()

  const handleDelete = async () => {
    if (!confirm('Delete this text variation?')) return
    try {
      await deleteTextVariation(text.id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete text')
    }
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm text-gray-700">{text.content}</span>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-700 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
