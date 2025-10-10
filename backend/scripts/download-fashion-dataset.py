#!/usr/bin/env python3
"""
============================================
FASHION DATASET DOWNLOADER
============================================
Downloads fashion poses from Hugging Face
Dataset: SaffalPoosh/deepFashion-with-masks
Target: 800 fashion model poses
============================================
"""

import json
import os
from pathlib import Path
from datasets import load_dataset
from PIL import Image

# Configuration
DATASET_NAME = "SaffalPoosh/deepFashion-with-masks"
SAMPLE_LIMIT = 800
OUTPUT_DIR = Path(__file__).parent.parent / "storage" / "pose-dataset" / "fashion"

def main():
    print("Fashion Dataset Downloader")
    print("=" * 50)
    print(f"Dataset: {DATASET_NAME}")
    print(f"Samples: {SAMPLE_LIMIT}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[OK] Output directory ready: {OUTPUT_DIR}")

    # Load dataset
    print(f"\n[LOAD] Loading dataset from Hugging Face...")
    try:
        dataset = load_dataset(DATASET_NAME, split=f"train[:{SAMPLE_LIMIT}]")
        print(f"[OK] Loaded {len(dataset)} samples")
    except Exception as e:
        print(f"[ERROR] Error loading dataset: {e}")
        return

    # Process samples
    metadata = []
    print(f"\n[PROCESS] Processing {len(dataset)} samples...")

    for idx, sample in enumerate(dataset):
        try:
            # Progress indicator
            if (idx + 1) % 50 == 0 or idx == 0:
                print(f"   Processing {idx + 1}/{len(dataset)}...")

            # Extract metadata
            item = {
                "id": f"fashion_{idx:04d}",
                "category": "fashion",
                "gender": sample.get("gender", "unknown"),
                "pose": sample.get("pose", "unknown"),
                "cloth": sample.get("cloth", "unknown"),
                "caption": sample.get("caption", ""),
                "pid": sample.get("pid", ""),
                "image_filename": f"fashion_{idx:04d}_image.jpg",
                "mask_filename": f"fashion_{idx:04d}_mask.jpg",
                "mask_overlay_filename": f"fashion_{idx:04d}_overlay.jpg",
            }

            # Save images
            if "image" in sample and sample["image"] is not None:
                img_path = OUTPUT_DIR / item["image_filename"]
                sample["image"].save(img_path)

            if "mask" in sample and sample["mask"] is not None:
                mask_path = OUTPUT_DIR / item["mask_filename"]
                sample["mask"].save(mask_path)

            if "mask_overlay" in sample and sample["mask_overlay"] is not None:
                overlay_path = OUTPUT_DIR / item["mask_overlay_filename"]
                sample["mask_overlay"].save(overlay_path)

            metadata.append(item)

        except Exception as e:
            print(f"   [WARN] Error processing sample {idx}: {e}")
            continue

    # Save metadata JSON
    metadata_path = OUTPUT_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # Summary
    print("\n" + "=" * 50)
    print("[SUCCESS] Fashion dataset download complete!")
    print(f"   Samples: {len(metadata)}")
    print(f"   Location: {OUTPUT_DIR}")
    print(f"   Metadata: {metadata_path}")
    print()

    # Statistics
    genders = {}
    clothes = {}
    for item in metadata:
        genders[item['gender']] = genders.get(item['gender'], 0) + 1
        clothes[item['cloth']] = clothes.get(item['cloth'], 0) + 1

    print("[STATS] Statistics:")
    print(f"   Gender distribution:")
    for gender, count in sorted(genders.items(), key=lambda x: x[1], reverse=True):
        print(f"      {gender}: {count}")

    print(f"\n   Top clothing types:")
    for cloth, count in sorted(clothes.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"      {cloth}: {count}")

    print("\n[DONE] Ready for keypoint processing.")

if __name__ == "__main__":
    main()
