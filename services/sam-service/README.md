# SAM Service

Segment Anything Model (SAM) microservice for Lumiku Apps.

## Quick Start

### 1. Install Dependencies

```bash
cd services/sam-service
pip install -r requirements.txt
```

### 2. Download Model

Download MobileSAM checkpoint:

```bash
wget https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt
```

### 3. Configure

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Run Service

```bash
python app.py
```

Service will start on http://localhost:5001

## API Endpoints

### GET `/health`
Health check

### POST `/segment/point`
Segment object by single point click

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "point": [100, 200],
  "objectPrompt": "shirt"
}
```

**Response:**
```json
{
  "success": true,
  "maskBase64": "data:image/png;base64,...",
  "confidence": 0.95,
  "message": "Segmentation successful"
}
```

### POST `/segment/points`
Segment by multiple points

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "points": [[100, 200], [150, 250]],
  "objectPrompt": "person"
}
```

### POST `/segment/box`
Segment by bounding box

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "box": [50, 50, 200, 300]
}
```

## Model Options

Edit `.env` to switch models:

```bash
# MobileSAM (CPU-friendly, 60x smaller)
SAM_MODEL=mobile_sam
SAM_CHECKPOINT=mobile_sam.pt

# SAM ViT-H (Best quality, requires GPU)
SAM_MODEL=sam_vit_h
SAM_CHECKPOINT=sam_vit_h_4b8939.pth
```

## Performance

- **MobileSAM on CPU:** ~3 seconds per image
- **MobileSAM on GPU:** ~10-12ms per image
- **SAM Original on GPU:** ~50ms per image

## Requirements

- Python >= 3.8
- PyTorch >= 1.7
- 8GB RAM minimum (16GB recommended)
- GPU optional (CUDA support recommended for production)
