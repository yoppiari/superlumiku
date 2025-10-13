"""
SAM Service - FastAPI Application
Provides REST API for Segment Anything Model (SAM)
"""

import os
import base64
import io
import logging
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
from dotenv import load_dotenv

from sam_model import SAMModel

# Load environment variables
load_dotenv()

# Configuration
PORT = int(os.getenv("PORT", 5001))
HOST = os.getenv("HOST", "0.0.0.0")
SAM_MODEL = os.getenv("SAM_MODEL", "mobile_sam")
SAM_CHECKPOINT = os.getenv("SAM_CHECKPOINT", "mobile_sam.pt")
DEVICE = os.getenv("DEVICE", "auto")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="SAM Service",
    description="Segment Anything Model API for Lumiku Apps",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global SAM model instance
sam_model: Optional[SAMModel] = None


# Request/Response models
class SegmentPointRequest(BaseModel):
    image: str  # Base64 encoded image
    point: List[int]  # [x, y]
    objectPrompt: Optional[str] = None  # For future use


class SegmentPointsRequest(BaseModel):
    image: str
    points: List[List[int]]  # [[x1, y1], [x2, y2], ...]
    objectPrompt: Optional[str] = None


class SegmentBoxRequest(BaseModel):
    image: str
    box: List[int]  # [x1, y1, x2, y2]


class SegmentResponse(BaseModel):
    success: bool
    maskBase64: Optional[str] = None
    confidence: Optional[float] = None
    message: Optional[str] = None


# Utility functions
def base64_to_image(base64_str: str) -> np.ndarray:
    """Convert base64 string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        # Decode base64
        image_data = base64.b64decode(base64_str)

        # Open image
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Convert to numpy array
        return np.array(image)

    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image format")


def mask_to_base64(mask: np.ndarray) -> str:
    """Convert mask to base64 string"""
    try:
        # Convert mask to image
        mask_image = sam_model.mask_to_image(mask)

        # Convert to base64
        buffered = io.BytesIO()
        mask_image.save(buffered, format="PNG")
        mask_base64 = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{mask_base64}"

    except Exception as e:
        logger.error(f"Failed to convert mask to base64: {e}")
        raise


# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize SAM model on startup"""
    global sam_model

    try:
        logger.info("🚀 Starting SAM Service...")
        logger.info(f"Model: {SAM_MODEL}")
        logger.info(f"Device: {DEVICE}")

        sam_model = SAMModel(
            model_type=SAM_MODEL,
            checkpoint_path=SAM_CHECKPOINT,
            device=DEVICE
        )

        logger.info("✅ SAM Service ready!")

    except Exception as e:
        logger.error(f"❌ Failed to start SAM Service: {e}")
        raise


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SAM Service",
        "version": "1.0.0",
        "model": SAM_MODEL,
        "device": DEVICE,
        "status": "ready" if sam_model and sam_model.is_ready() else "not ready"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if sam_model is None or not sam_model.is_ready():
        raise HTTPException(status_code=503, detail="SAM model not ready")

    return {
        "status": "healthy",
        "model": SAM_MODEL,
        "device": sam_model.device
    }


@app.post("/segment/point", response_model=SegmentResponse)
async def segment_by_point(request: SegmentPointRequest):
    """
    Segment object by single point click

    Args:
        image: Base64 encoded image
        point: [x, y] coordinates
        objectPrompt: Optional hint for object type

    Returns:
        Mask as base64 encoded PNG image
    """
    try:
        if sam_model is None or not sam_model.is_ready():
            raise HTTPException(status_code=503, detail="SAM model not ready")

        logger.info(f"Segmenting by point: {request.point}")

        # Convert base64 to image
        image_np = base64_to_image(request.image)

        # Segment
        mask, confidence = sam_model.segment_by_point(
            image_np,
            point=tuple(request.point)
        )

        # Convert mask to base64
        mask_base64 = mask_to_base64(mask)

        return SegmentResponse(
            success=True,
            maskBase64=mask_base64,
            confidence=confidence,
            message="Segmentation successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Segmentation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/segment/points", response_model=SegmentResponse)
async def segment_by_points(request: SegmentPointsRequest):
    """
    Segment object by multiple points

    Args:
        image: Base64 encoded image
        points: [[x1, y1], [x2, y2], ...] coordinates
        objectPrompt: Optional hint for object type

    Returns:
        Merged mask as base64 encoded PNG image
    """
    try:
        if sam_model is None or not sam_model.is_ready():
            raise HTTPException(status_code=503, detail="SAM model not ready")

        logger.info(f"Segmenting by {len(request.points)} points")

        # Convert base64 to image
        image_np = base64_to_image(request.image)

        # Segment
        mask, confidence = sam_model.segment_by_points(
            image_np,
            points=request.points
        )

        # Convert mask to base64
        mask_base64 = mask_to_base64(mask)

        return SegmentResponse(
            success=True,
            maskBase64=mask_base64,
            confidence=confidence,
            message="Multi-point segmentation successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-point segmentation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/segment/box", response_model=SegmentResponse)
async def segment_by_box(request: SegmentBoxRequest):
    """
    Segment object by bounding box

    Args:
        image: Base64 encoded image
        box: [x1, y1, x2, y2] coordinates

    Returns:
        Mask as base64 encoded PNG image
    """
    try:
        if sam_model is None or not sam_model.is_ready():
            raise HTTPException(status_code=503, detail="SAM model not ready")

        logger.info(f"Segmenting by box: {request.box}")

        # Convert base64 to image
        image_np = base64_to_image(request.image)

        # Segment
        mask, confidence = sam_model.segment_by_box(
            image_np,
            box=tuple(request.box)
        )

        # Convert mask to base64
        mask_base64 = mask_to_base64(mask)

        return SegmentResponse(
            success=True,
            maskBase64=mask_base64,
            confidence=confidence,
            message="Box segmentation successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Box segmentation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {HOST}:{PORT}")

    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level=LOG_LEVEL.lower()
    )
