/**
 * ============================================
 * POSE TEMPLATES SEED SCRIPT
 * ============================================
 * Seeds pose_templates table with downloaded pose datasets
 *
 * Prerequisites:
 * - Fashion dataset downloaded (800 samples)
 * - Lifestyle dataset downloaded (300 samples)
 *
 * Usage:
 *   bun run scripts/seed-pose-templates.ts
 *
 * Options:
 *   --fashion-only: Seed only fashion poses
 *   --lifestyle-only: Seed only lifestyle poses
 *   --limit=N: Limit number of poses to seed
 * ============================================
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  FASHION_DIR: join(__dirname, '..', 'storage', 'pose-dataset', 'fashion'),
  LIFESTYLE_DIR: join(__dirname, '..', 'storage', 'pose-dataset', 'lifestyle'),
  BATCH_SIZE: 50, // Insert in batches for performance
};

// ============================================
// TYPES
// ============================================

interface FashionMetadata {
  id: string;
  category: string;
  gender: string;
  pose: string;
  cloth: string;
  caption: string;
  pid: string;
  image_filename: string;
  mask_filename: string;
  mask_overlay_filename: string;
}

interface LifestyleMetadata {
  id: string;
  category: string;
  text: string;
  image_filename: string;
  conditioning_filename: string;
}

interface PoseTemplateData {
  category: string;
  subcategory: string;
  keypointsJson: string;
  previewUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  description?: string;
  gender?: string;
  productPlacement?: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('[SEED] Starting Pose Templates Seeding');
  console.log('=' .repeat(50));

  // Parse arguments
  const args = process.argv.slice(2);
  const fashionOnly = args.includes('--fashion-only');
  const lifestyleOnly = args.includes('--lifestyle-only');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

  try {
    // Check database connection
    await prisma.$connect();
    console.log('[OK] Database connected\n');

    let totalSeeded = 0;

    // Seed fashion poses
    if (!lifestyleOnly) {
      const fashionCount = await seedFashionPoses(limit);
      totalSeeded += fashionCount;
    }

    // Seed lifestyle poses
    if (!fashionOnly) {
      const lifestyleCount = await seedLifestylePoses(limit);
      totalSeeded += lifestyleCount;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('[SUCCESS] Pose Templates Seeding Complete!');
    console.log(`   Total poses seeded: ${totalSeeded}`);
    console.log('='.repeat(50));

    // Verification
    const totalInDb = await prisma.poseTemplate.count();
    console.log(`\n[VERIFY] Total poses in database: ${totalInDb}`);

    // Statistics
    await printStatistics();

  } catch (error) {
    console.error('[ERROR] Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// SEED FASHION POSES
// ============================================

async function seedFashionPoses(limit?: number | null): Promise<number> {
  console.log('[FASHION] Seeding fashion poses...');

  try {
    // Load metadata
    const metadataPath = join(CONFIG.FASHION_DIR, 'metadata.json');
    const metadata: FashionMetadata[] = JSON.parse(readFileSync(metadataPath, 'utf-8'));

    const posesToSeed = limit ? metadata.slice(0, limit) : metadata;
    console.log(`[FASHION] Loading ${posesToSeed.length} fashion poses`);

    // Process in batches
    let seeded = 0;
    for (let i = 0; i < posesToSeed.length; i += CONFIG.BATCH_SIZE) {
      const batch = posesToSeed.slice(i, i + CONFIG.BATCH_SIZE);

      const poseData = batch.map(item => ({
        category: 'fashion',
        subcategory: item.cloth || 'general',
        keypointsJson: generateDummyKeypoints(), // TODO: Extract actual keypoints
        previewUrl: `/storage/pose-dataset/fashion/${item.image_filename}`,
        difficulty: assignDifficulty(item),
        tags: generateTags(item),
        description: item.caption,
        gender: item.gender?.toLowerCase(),
        productPlacement: 'body',
        isActive: true,
        successRate: 0.95,
        avgQualityScore: 0.85,
      }));

      await prisma.poseTemplate.createMany({
        data: poseData,
        skipDuplicates: true,
      });

      seeded += batch.length;
      console.log(`   [FASHION] Seeded ${seeded}/${posesToSeed.length}...`);
    }

    console.log(`[OK] Fashion poses seeded: ${seeded}\n`);
    return seeded;

  } catch (error) {
    console.error('[ERROR] Failed to seed fashion poses:', error);
    return 0;
  }
}

// ============================================
// SEED LIFESTYLE POSES
// ============================================

async function seedLifestylePoses(limit?: number | null): Promise<number> {
  console.log('[LIFESTYLE] Seeding lifestyle poses...');

  try {
    // Load metadata
    const metadataPath = join(CONFIG.LIFESTYLE_DIR, 'metadata.json');
    const metadata: LifestyleMetadata[] = JSON.parse(readFileSync(metadataPath, 'utf-8'));

    const posesToSeed = limit ? metadata.slice(0, limit) : metadata;
    console.log(`[LIFESTYLE] Loading ${posesToSeed.length} lifestyle poses`);

    // Process in batches
    let seeded = 0;
    for (let i = 0; i < posesToSeed.length; i += CONFIG.BATCH_SIZE) {
      const batch = posesToSeed.slice(i, i + CONFIG.BATCH_SIZE);

      const poseData = batch.map(item => ({
        category: 'lifestyle',
        subcategory: detectSubcategory(item.text),
        keypointsJson: '/storage/pose-dataset/lifestyle/' + item.conditioning_filename, // OpenPose image
        previewUrl: `/storage/pose-dataset/lifestyle/${item.image_filename}`,
        difficulty: 'medium' as const,
        tags: generateLifestyleTags(item.text),
        description: item.text,
        gender: 'unisex',
        productPlacement: 'hand',
        isActive: true,
        successRate: 0.90,
        avgQualityScore: 0.80,
      }));

      await prisma.poseTemplate.createMany({
        data: poseData,
        skipDuplicates: true,
      });

      seeded += batch.length;
      console.log(`   [LIFESTYLE] Seeded ${seeded}/${posesToSeed.length}...`);
    }

    console.log(`[OK] Lifestyle poses seeded: ${seeded}\n`);
    return seeded;

  } catch (error) {
    console.error('[ERROR] Failed to seed lifestyle poses:', error);
    return 0;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateDummyKeypoints(): string {
  // Dummy OpenPose keypoints (18-point format)
  // TODO: Extract actual keypoints from images using OpenPose or MediaPipe
  const keypoints = {
    version: "1.0",
    people: [{
      pose_keypoints_2d: Array(54).fill(0), // 18 points * 3 (x, y, confidence)
    }]
  };
  return JSON.stringify(keypoints);
}

function assignDifficulty(item: FashionMetadata): 'easy' | 'medium' | 'hard' {
  // Simple heuristic based on pose name
  const pose = item.pose?.toLowerCase() || '';
  if (pose.includes('standing') || pose.includes('front')) return 'easy';
  if (pose.includes('sitting') || pose.includes('side')) return 'medium';
  return 'hard';
}

function generateTags(item: FashionMetadata): string {
  const tags: string[] = [];

  // Add gender tag
  if (item.gender) tags.push(item.gender.toLowerCase());

  // Add cloth type
  if (item.cloth && item.cloth !== 'unknown') tags.push(item.cloth);

  // Add pose type
  if (item.pose && item.pose !== 'unknown') tags.push(item.pose);

  // Add general tags
  tags.push('fashion', 'model', 'e-commerce');

  return tags.join(',');
}

function detectSubcategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('basketball') || lower.includes('football')) return 'sports';
  if (lower.includes('urban') || lower.includes('street')) return 'urban';
  if (lower.includes('outdoor') || lower.includes('nature')) return 'outdoor';
  return 'general';
}

function generateLifestyleTags(text: string): string {
  const tags: string[] = ['lifestyle'];

  const lower = text.toLowerCase();
  if (lower.includes('sport')) tags.push('sports', 'athletic');
  if (lower.includes('urban')) tags.push('urban', 'street');
  if (lower.includes('outdoor')) tags.push('outdoor', 'nature');
  if (lower.includes('action')) tags.push('action', 'dynamic');

  tags.push('lifestyle', 'authentic');

  return tags.join(',');
}

// ============================================
// PRINT STATISTICS
// ============================================

async function printStatistics() {
  console.log('\n[STATS] Database Statistics:');

  // By category
  const byCategory = await prisma.poseTemplate.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('   By category:');
  for (const group of byCategory) {
    console.log(`      ${group.category}: ${group._count}`);
  }

  // By difficulty
  const byDifficulty = await prisma.poseTemplate.groupBy({
    by: ['difficulty'],
    _count: true,
  });

  console.log('   By difficulty:');
  for (const group of byDifficulty) {
    console.log(`      ${group.difficulty}: ${group._count}`);
  }

  // By gender
  const byGender = await prisma.poseTemplate.groupBy({
    by: ['gender'],
    _count: true,
  });

  console.log('   By gender:');
  for (const group of byGender.filter(g => g.gender)) {
    console.log(`      ${group.gender}: ${group._count}`);
  }
}

// ============================================
// RUN
// ============================================

main()
  .catch(console.error)
  .finally(() => process.exit());
