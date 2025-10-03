/**
 * Text Variation Algorithms
 * Adopted from Carousel Mix reference app with adaptations
 */

export type TextVariationAlgorithm = 'random' | 'sequential' | 'weighted'

export interface TextVariationSettings {
  algorithm: TextVariationAlgorithm
  texts: string[]
  count: number
}

/**
 * Random Selection Algorithm
 * Randomly picks texts for each position
 * Great for maximum variation and unpredictability
 */
export function randomSelection(texts: string[], count: number): string[] {
  if (texts.length === 0) return []

  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * texts.length)
    result.push(texts[randomIndex])
  }

  return result
}

/**
 * Sequential Rotation Algorithm
 * Cycles through texts in order (0, 1, 2, 0, 1, 2, ...)
 * Good for ensuring even distribution across all text variations
 */
export function sequentialRotation(texts: string[], count: number): string[] {
  if (texts.length === 0) return []

  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const index = i % texts.length
    result.push(texts[index])
  }

  return result
}

/**
 * Weighted Distribution Algorithm
 * Distributes count based on text length (longer texts get more weight)
 * Useful when some texts are more important or detailed
 */
export function weightedDistribution(texts: string[], count: number): string[] {
  if (texts.length === 0) return []
  if (count === 0) return []

  // Calculate weights based on text length
  // Using power of 1.5 to give longer texts more weight without being too extreme
  const weights = texts.map((t) => Math.pow(t.length, 1.5))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  // Calculate how many times each text should appear
  const distribution = weights.map((w) => Math.round((w / totalWeight) * count))

  // Adjust distribution to match exact count
  let currentTotal = distribution.reduce((sum, d) => sum + d, 0)

  if (currentTotal < count) {
    // Add remaining slots to texts with highest weights
    const remaining = count - currentTotal
    const sortedIndices = weights
      .map((w, i) => ({ weight: w, index: i }))
      .sort((a, b) => b.weight - a.weight)

    for (let i = 0; i < remaining; i++) {
      distribution[sortedIndices[i % sortedIndices.length].index]++
    }
  } else if (currentTotal > count) {
    // Remove excess slots from texts with lowest weights
    const excess = currentTotal - count
    const sortedIndices = weights
      .map((w, i) => ({ weight: w, index: i }))
      .sort((a, b) => a.weight - b.weight)

    for (let i = 0; i < excess; i++) {
      const idx = sortedIndices[i % sortedIndices.length].index
      if (distribution[idx] > 0) {
        distribution[idx]--
      }
    }
  }

  // Build result array based on distribution
  const result: string[] = []
  texts.forEach((text, idx) => {
    for (let i = 0; i < distribution[idx]; i++) {
      result.push(text)
    }
  })

  // Shuffle to avoid grouping (optional, can be controlled by parameter)
  return shuffleArray(result)
}

/**
 * Apply text variation algorithm
 * Main entry point that chooses the right algorithm
 */
export function applyTextVariation(
  settings: TextVariationSettings,
  slideCount: number
): string[] {
  const { algorithm, texts, count } = settings

  if (texts.length === 0) {
    return []
  }

  const targetCount = count || slideCount

  switch (algorithm) {
    case 'random':
      return randomSelection(texts, targetCount)

    case 'sequential':
      return sequentialRotation(texts, targetCount)

    case 'weighted':
      return weightedDistribution(texts, targetCount)

    default:
      console.warn(`Unknown algorithm: ${algorithm}, falling back to sequential`)
      return sequentialRotation(texts, targetCount)
  }
}

/**
 * Calculate possible combinations
 * For estimating how many unique carousels can be generated
 */
export function calculatePossibleCombinations(
  slideCount: number,
  textCount: number,
  algorithm: TextVariationAlgorithm
): number {
  if (slideCount === 0 || textCount === 0) return 0

  switch (algorithm) {
    case 'random':
      // For random: each slide can have any text
      // Combinations = textCount ^ slideCount
      if (textCount > 10 || slideCount > 10) return Infinity
      return Math.pow(textCount, slideCount)

    case 'sequential':
      // For sequential: depends on LCM of textCount and slideCount
      // But for simplicity, we consider rotations
      return Math.max(textCount, slideCount)

    case 'weighted':
      // For weighted: similar to random but distribution matters
      // We use permutations formula
      if (slideCount > 10 || textCount > 10) return Infinity
      return factorial(slideCount) * factorial(textCount)

    default:
      return slideCount
  }
}

/**
 * Calculate anti-fingerprinting strength
 * 0 = None, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong, 5 = Excellent
 */
export function calculateAntiFingerprintingStrength(settings: TextVariationSettings): number {
  let score = 0

  // Base score for text variation
  if (settings.texts.length > 0) {
    score += 1
  }

  // Algorithm bonus
  if (settings.algorithm === 'random') {
    score += 2 // Random is strongest
  } else if (settings.algorithm === 'weighted') {
    score += 1
  }

  // Text diversity bonus
  if (settings.texts.length >= 3) {
    score += 1
  }

  // Large variation count bonus
  if (settings.count >= 10) {
    score += 1
  }

  return Math.min(score, 5)
}

// ===== Utility Functions =====

/**
 * Fisher-Yates shuffle algorithm
 * Randomizes array order
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Calculate factorial
 * Used for combination calculations
 */
function factorial(n: number): number {
  if (n <= 1) return 1
  if (n > 170) return Infinity // JavaScript number limit
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

/**
 * Calculate GCD (Greatest Common Divisor)
 * Used for sequential rotation calculations
 */
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

/**
 * Calculate LCM (Least Common Multiple)
 * Used for sequential rotation calculations
 */
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}
