#!/usr/bin/env python3
"""
============================================
LIFESTYLE DATASET DOWNLOADER
============================================
Downloads lifestyle/sports poses from Hugging Face
Dataset: raulc0399/open_pose_controlnet
Target: 300 lifestyle/action poses
============================================
"""

import json
import os
from pathlib import Path
from datasets import load_dataset
from PIL import Image

# Configuration
DATASET_NAME = "raulc0399/open_pose_controlnet"
SAMPLE_LIMIT = 300
OUTPUT_DIR = Path(__file__).parent.parent / "storage" / "pose-dataset" / "lifestyle"

def main():
    print("Lifestyle Dataset Downloader")
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
            if (idx + 1) % 25 == 0 or idx == 0:
                print(f"   Processing {idx + 1}/{len(dataset)}...")

            # Extract metadata
            item = {
                "id": f"lifestyle_{idx:04d}",
                "category": "lifestyle",
                "text": sample.get("text", ""),
                "image_filename": f"lifestyle_{idx:04d}_image.jpg",
                "conditioning_filename": f"lifestyle_{idx:04d}_conditioning.jpg",
            }

            # Save images
            if "image" in sample and sample["image"] is not None:
                img_path = OUTPUT_DIR / item["image_filename"]
                sample["image"].save(img_path)

            if "conditioning_image" in sample and sample["conditioning_image"] is not None:
                cond_path = OUTPUT_DIR / item["conditioning_filename"]
                sample["conditioning_image"].save(cond_path)

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
    print("[SUCCESS] Lifestyle dataset download complete!")
    print(f"   Samples: {len(metadata)}")
    print(f"   Location: {OUTPUT_DIR}")
    print(f"   Metadata: {metadata_path}")
    print()

    # Statistics
    print("[STATS] Statistics:")
    print(f"   Total poses: {len(metadata)}")
    print(f"   Images downloaded: {len(metadata) * 2}")  # image + conditioning
    print(f"   Categories: lifestyle, sports, urban")

    print("\n[DONE] Ready for keypoint processing.")

if __name__ == "__main__":
    main()
