export class CombinationService {
  /**
   * Calculate factorial (n!)
   */
  private factorial(n: number): number {
    if (n <= 1) return 1
    return n * this.factorial(n - 1)
  }

  /**
   * Calculate permutations: nPr = n! / (n-r)!
   */
  private permutations(n: number, r: number): number {
    if (r > n) return 0
    return this.factorial(n) / this.factorial(n - r)
  }

  /**
   * Calculate total possible carousel combinations
   *
   * Given:
   * - N slides available
   * - R slides per carousel
   * - T text overlays
   *
   * Total combinations = (nPr) × (r+1)^t
   * Where:
   * - nPr = slide order permutations
   * - (r+1)^t = text placement options (each text can go on any of r slides, or not used)
   */
  calculateCombinations(
    numSlidesAvailable: number,
    numSlidesPerCarousel: number,
    numTexts: number
  ): number {
    // Slide permutations (order matters)
    const slidePermutations = this.permutations(numSlidesAvailable, numSlidesPerCarousel)

    // Text placement options
    // Each text can be placed on any of the R slides, or not used at all
    // So (R+1) options per text, raised to power of T texts
    const textOptions = Math.pow(numSlidesPerCarousel + 1, numTexts)

    return slidePermutations * textOptions
  }

  /**
   * Generate random slide combinations
   */
  generateSlideCombinations(
    slideIds: string[],
    numSlidesPerCarousel: number,
    numSets: number
  ): string[][] {
    const combinations: string[][] = []
    const usedCombinations = new Set<string>()

    let attempts = 0
    const maxAttempts = numSets * 10 // Prevent infinite loop

    while (combinations.length < numSets && attempts < maxAttempts) {
      attempts++

      // Randomly select slides
      const shuffled = [...slideIds].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, numSlidesPerCarousel)

      // Create unique key for this combination
      const key = selected.sort().join(',')

      // Only add if this exact combination hasn't been used
      if (!usedCombinations.has(key)) {
        usedCombinations.add(key)
        combinations.push(selected)
      }
    }

    return combinations
  }

  /**
   * Generate random text placements for each carousel set
   */
  generateTextPlacements(
    textIds: string[],
    numSlidesPerCarousel: number,
    numSets: number
  ): Map<string, number>[] {
    // Returns array of maps: [{ textId -> slideIndex }]
    const placements: Map<string, number>[] = []

    for (let i = 0; i < numSets; i++) {
      const placement = new Map<string, number>()

      for (const textId of textIds) {
        // Randomly assign to a slide (0-indexed) or -1 for "not used"
        const slideIndex = Math.floor(Math.random() * (numSlidesPerCarousel + 1)) - 1
        placement.set(textId, slideIndex)
      }

      placements.push(placement)
    }

    return placements
  }

  /**
   * Estimate if generation is feasible
   */
  isFeasible(
    numSlidesAvailable: number,
    numSlidesPerCarousel: number,
    numTexts: number,
    requestedSets: number
  ): { feasible: boolean; maxSets: number; reason?: string } {
    const totalCombinations = this.calculateCombinations(
      numSlidesAvailable,
      numSlidesPerCarousel,
      numTexts
    )

    if (requestedSets > totalCombinations) {
      return {
        feasible: false,
        maxSets: totalCombinations,
        reason: `Only ${totalCombinations} unique combinations possible with current settings`,
      }
    }

    return {
      feasible: true,
      maxSets: totalCombinations,
    }
  }
}
