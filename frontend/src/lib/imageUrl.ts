// Helper to get full image URL
export function getImageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined

  // If path already starts with http, return as is
  if (path.startsWith('http')) {
    return path
  }

  // Otherwise prepend backend URL
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return `${backendUrl}${path}`
}
