"""
MobileSAM Model Wrapper
Handles model loading, inference, and mask generation
"""

import os
import torch
import numpy as np
from PIL import Image
from mobile_sam import sam_model_registry, SamPredictor
import logging

logger = logging.getLogger(__name__)


class SAMModel:
    def __init__(self, model_type="mobile_sam", checkpoint_path="mobile_sam.pt", device="auto"):
        """
        Initialize SAM model

        Args:
            model_type: Type of model (mobile_sam, sam_vit_b, sam_vit_l, sam_vit_h)
            checkpoint_path: Path to model checkpoint
            device: Device to run on (cuda, cpu, auto)
        """
        self.model_type = model_type
        self.checkpoint_path = checkpoint_path

        # Auto-detect device
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        logger.info(f"Initializing SAM model: {model_type}")
        logger.info(f"Device: {self.device}")
        logger.info(f"Checkpoint: {checkpoint_path}")

        self.predictor = None
        self._load_model()

    def _load_model(self):
        """Load the SAM model"""
        try:
            # Map model type to registry key
            model_registry_key = {
                "mobile_sam": "vit_t",
                "sam_vit_b": "vit_b",
                "sam_vit_l": "vit_l",
                "sam_vit_h": "vit_h",
            }.get(self.model_type, "vit_t")

            # Load model
            sam = sam_model_registry[model_registry_key](checkpoint=self.checkpoint_path)
            sam.to(device=self.device)
            sam.eval()

            # Create predictor
            self.predictor = SamPredictor(sam)

            logger.info("✅ SAM model loaded successfully")

        except Exception as e:
            logger.error(f"❌ Failed to load SAM model: {e}")
            raise

    def segment_by_point(self, image: np.ndarray, point: tuple, label: int = 1):
        """
        Segment object by single point

        Args:
            image: RGB image as numpy array (H, W, 3)
            point: (x, y) coordinates
            label: 1 for foreground, 0 for background

        Returns:
            mask: Binary mask as numpy array (H, W)
            score: Confidence score
        """
        try:
            # Set image
            self.predictor.set_image(image)

            # Prepare point input
            point_coords = np.array([[point[0], point[1]]])
            point_labels = np.array([label])

            # Predict
            masks, scores, logits = self.predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=False
            )

            # Return best mask
            mask = masks[0]
            score = float(scores[0])

            logger.info(f"✅ Segmented by point {point} with score {score:.3f}")

            return mask, score

        except Exception as e:
            logger.error(f"❌ Segmentation failed: {e}")
            raise

    def segment_by_points(self, image: np.ndarray, points: list, labels: list = None):
        """
        Segment object by multiple points

        Args:
            image: RGB image as numpy array (H, W, 3)
            points: List of (x, y) coordinates
            labels: List of labels (1 for foreground, 0 for background)

        Returns:
            mask: Binary mask as numpy array (H, W)
            score: Confidence score
        """
        try:
            # Set image
            self.predictor.set_image(image)

            # Prepare points
            point_coords = np.array(points)

            if labels is None:
                point_labels = np.ones(len(points), dtype=int)
            else:
                point_labels = np.array(labels)

            # Predict
            masks, scores, logits = self.predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=False
            )

            # Return best mask
            mask = masks[0]
            score = float(scores[0])

            logger.info(f"✅ Segmented by {len(points)} points with score {score:.3f}")

            return mask, score

        except Exception as e:
            logger.error(f"❌ Multi-point segmentation failed: {e}")
            raise

    def segment_by_box(self, image: np.ndarray, box: tuple):
        """
        Segment object by bounding box

        Args:
            image: RGB image as numpy array (H, W, 3)
            box: (x1, y1, x2, y2) coordinates

        Returns:
            mask: Binary mask as numpy array (H, W)
            score: Confidence score
        """
        try:
            # Set image
            self.predictor.set_image(image)

            # Prepare box
            box_coords = np.array([box[0], box[1], box[2], box[3]])

            # Predict
            masks, scores, logits = self.predictor.predict(
                box=box_coords,
                multimask_output=False
            )

            # Return best mask
            mask = masks[0]
            score = float(scores[0])

            logger.info(f"✅ Segmented by box with score {score:.3f}")

            return mask, score

        except Exception as e:
            logger.error(f"❌ Box segmentation failed: {e}")
            raise

    def mask_to_image(self, mask: np.ndarray) -> Image.Image:
        """
        Convert binary mask to PIL Image

        Args:
            mask: Binary mask (True/False or 0/1)

        Returns:
            PIL Image (black background, white foreground)
        """
        # Convert to uint8 (0 or 255)
        mask_uint8 = (mask * 255).astype(np.uint8)

        # Convert to PIL Image
        mask_image = Image.fromarray(mask_uint8, mode='L')

        return mask_image

    def is_ready(self) -> bool:
        """Check if model is loaded and ready"""
        return self.predictor is not None
