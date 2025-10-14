# Lumiku Applications - Complete Overview

---
**Last Updated:** 2025-10-14
**Total Apps:** 8
**Status:** All Production Ready
---

## Overview

Lumiku features 8 specialized AI-powered applications for content creation. Each app is built as an isolated plugin with its own routes, services, and database models.

**App Categories:**
- **Video Creation** (3 apps): Video Mixer, Looping Flow, Video Generator
- **Image/Carousel** (2 apps): Carousel Mix, Poster Editor
- **Avatar System** (3 apps): Avatar Creator, Avatar Generator, Pose Generator

---

## Quick Comparison

| App | Type | Backend | Frontend | Database Models | Credit Cost | Main Use Case |
|-----|------|---------|----------|-----------------|-------------|---------------|
| Video Mixer | Video | Yes | Yes | 4 | 1-10+ | Mix videos with anti-fingerprinting |
| Carousel Mix | Image | Yes | Yes | 5 | 5-20 | Generate Instagram carousels |
| Looping Flow | Video | Yes | Yes | 4 | 5-15 | Create seamless video loops |
| Avatar Creator | AI | Yes | Yes | 6 | 0* | Create AI avatars with persona |
| Avatar Generator | AI | Yes | Yes | - | 5-10 | Generate avatar variations |
| Pose Generator | AI | No | Yes | - | - | Generate avatar poses |
| Poster Editor | AI | No | Yes | - | - | AI image editing/inpainting |
| Video Generator | AI | No | Yes | - | - | AI video generation |

*Avatar Creator: Credits disabled during development

---

## 1. Video Mixer

**Purpose:** Mix multiple short videos into longer unique videos with anti-fingerprinting features

**Route:** `/api/apps/video-mixer`
**Icon:** `video`
**Dashboard Order:** 5
**Status:** Production Ready

### Features
- Upload multiple videos to a project
- Organize videos into groups
- Generate multiple unique video variations
- Anti-fingerprinting options:
  - **Order Mixing:** Randomize video sequence per output
  - **Different Start:** Each variant starts with different video
  - **Group Mixing:** Random or sequential group ordering
  - **Speed Variations:** Variable playback speed (0.5x-2.0x)
- Quality settings:
  - Resolution: 480p, 720p, 1080p, 4K
  - Bitrate: Low, Medium, High
  - Frame Rate: 24, 30, 60 FPS
  - Aspect Ratio: 16:9, 9:16, 1:1, 4:5
- Duration management:
  - Original duration
  - Fixed duration with smart distribution
- Metadata customization:
  - CapCut, TikTok, Instagram, YouTube templates
- Audio options: Keep or mute

### Database Models
- `VideoMixerProject`: Project container
- `VideoMixerGroup`: Video grouping
- `VideoMixerVideo`: Individual videos
- `VideoMixerGeneration`: Generation jobs with settings

### Credit Costs (PAYG Users)
- Base generation: 1 credit per video
- Order mixing: +1 credit
- Speed variations: +1 credit
- HD (720p): +2 credits
- Full HD (1080p): +5 credits
- 4K: +10 credits
- High bitrate: +2 credits
- 60 FPS: +3 credits
- Aspect ratio conversion: +1 credit
- Smart distribution: +1 credit

**Example:** Generate 10 videos at 720p with order mixing and speed variations = (1 + 1 + 1 + 2) × 10 = 50 credits

### Quota Costs (Subscription Users)
- Standard generation: 1 quota per video
- 4K generation: 2-3 quotas per video

### Use Cases
- YouTube content creators (avoiding content ID)
- TikTok marketers (preventing duplicates)
- Educational content (course variations)
- Marketing campaigns (A/B testing)

### API Endpoints
- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `POST /projects/:id/videos` - Upload video
- `POST /projects/:id/groups` - Create group
- `POST /projects/:id/generate` - Generate videos
- `GET /projects/:id/generations` - List generations
- `GET /generations/:id/status` - Get generation status
- `GET /generations/:id/download` - Download outputs

### Related Documentation
- [Video Processing Architecture](../VIDEO_PROCESSING_ARCHITECTURE.md)
- [FFmpeg Configuration](../deployment/ffmpeg-setup.md)

---

## 2. Carousel Mix

**Purpose:** Generate Instagram/social media carousel posts automatically with smart image/text combinations

**Route:** `/api/apps/carousel-mix`
**Icon:** `layers`
**Dashboard Order:** 6
**Status:** Production Ready

### Features
- Position-based carousel structure (2-8 slides)
- Multiple images/videos per position
- Multiple text variations per position
- Advanced text styling:
  - Font family, size (% of image height), color, weight
  - Background color with transparency
  - Text position (presets or custom X/Y %)
  - Text alignment (left, center, right, justify)
  - Text shadow and outline
  - Custom padding
- Smart combination algorithms:
  - Sequential: Iterate through variations in order
  - Random: Random selection with no duplicates
  - Weighted: Prioritize certain variations
- Bulk generation (10+ carousels with multiplier)
- Export as images or ZIP

### Database Models
- `CarouselProject`: Project container
- `CarouselSlide`: Images/videos for each position
- `CarouselText`: Text variations for each position
- `CarouselPositionSettings`: Text styling per position
- `CarouselGeneration`: Generation jobs

### Credit Costs (PAYG Users)
- Base generation: 5 credits
- Per slide: +2 credits
- Per text variation: +1 credit
- Bulk multiplier (10+): 1.5x
- High resolution (future): +5 credits
- Video export (future): +15 credits
- PDF export (future): +10 credits

**Example:** 4-slide carousel with 3 text variations = 5 + (2 × 4) + (1 × 3) = 16 credits

### Quota Costs (Subscription Users)
- Standard carousel: 1 quota
- 8-slide carousel: 2 quotas
- Bulk generation (20+): 3-5 quotas

### Use Cases
- Instagram marketing campaigns
- Social media content batches
- Educational carousel posts
- Product showcase carousels
- Tutorial/how-to guides

### API Endpoints
- `POST /projects` - Create project
- `GET /projects` - List projects
- `POST /projects/:id/slides` - Upload slide
- `POST /projects/:id/texts` - Add text
- `PUT /projects/:id/position-settings/:position` - Update text style
- `POST /projects/:id/generate` - Generate carousels
- `GET /generations/:id/download` - Download ZIP

### Technical Details
- Text overlay with ImageMagick/Canvas
- Position-based variation system
- Automatic combination generation
- ZIP compression for batch downloads

---

## 3. Looping Flow

**Purpose:** Create perfect seamless video loops with multi-layer audio mixing

**Route:** `/api/apps/looping-flow`
**Icon:** `repeat`
**Dashboard Order:** 7
**Status:** Production Ready

### Features
- **Package 1: Perfect Seamless Loop**
  - Loop styles: Simple, Crossfade, Boomerang
  - Configurable crossfade duration (0.5-2.0s)
  - Video and audio crossfading
- **Package 2: Multi-Layer Audio**
  - Up to 4 audio layers
  - Individual volume control per layer
  - Fade in/out per layer
  - Mute original video audio option
  - Master volume control
- Target duration with automatic repetitions
- Background music for videos
- Perfect for ambient/background content

### Database Models
- `LoopingFlowProject`: Project container
- `LoopingFlowVideo`: Source videos
- `LoopingFlowGeneration`: Generation jobs
- `LoopingFlowAudioLayer`: Audio layers (up to 4)

### Credit Costs (PAYG Users)
- Base loop generation: 5 credits
- Crossfade loop: +2 credits
- Boomerang: +3 credits
- Per audio layer: +2 credits
- Long duration (>2 min): +5 credits

**Example:** 1-minute seamless loop with crossfade and 2 audio layers = 5 + 2 + (2 × 2) = 11 credits

### Quota Costs (Subscription Users)
- Standard loop: 1 quota
- Multi-layer audio (3-4 layers): 2 quotas

### Use Cases
- Background videos for streams
- Ambient content for meditation apps
- Social media looping videos
- Product showcase loops
- Website background videos

### API Endpoints
- `POST /projects` - Create project
- `POST /projects/:id/videos` - Upload video
- `POST /projects/:id/generate` - Generate loop (with audio layers)
- `GET /generations/:id/status` - Get status
- `GET /generations/:id/download` - Download loop

### Technical Details
- FFmpeg video looping with crossfade
- Audio mixing with multiple tracks
- Fade in/out transitions
- Duration calculation and repetition

---

## 4. Avatar Creator

**Purpose:** Create realistic AI avatars with full persona system for use across all Lumiku apps

**Route:** `/api/apps/avatar-creator`
**Icon:** `user-circle`
**Dashboard Order:** 1 (High Priority)
**Status:** Production Ready (Credits Disabled)

### Features
- **Generation Methods:**
  - Text-to-image (FLUX.1-dev + LoRA)
  - Upload custom image
  - Generate from presets
  - Generate from reference (img2img)
- **Persona System:**
  - Persona name, age
  - Personality traits (JSON array)
  - Background story
  - Use persona across other apps
- **Visual Attributes:**
  - Gender, age range
  - Ethnicity, body type
  - Hair style and color
  - Eye color, skin tone
  - Style/theme
- **Usage Tracking:**
  - Track avatar usage across apps
  - Usage history per avatar
  - Usage analytics
- **Presets Library:**
  - Business, Casual, Traditional, Creative
  - Pre-defined persona templates
  - Quick avatar generation

### Database Models
- `AvatarProject`: Project container
- `Avatar`: Individual avatars with persona
- `AvatarPreset`: Pre-defined avatar templates
- `PersonaExample`: Example personas
- `AvatarUsageHistory`: Cross-app usage tracking
- `AvatarGeneration`: Generation jobs

### Credit Costs (PAYG Users)
**Currently disabled (all set to 0)**

**Planned:**
- Generate avatar: 10 credits
- Upload avatar: 2 credits
- From preset: 8 credits
- From reference: 12 credits
- Edit persona: 0 credits (free)

### Quota Costs (Subscription Users)
- Avatar generation: 1 quota (Basic+)
- High-quality generation: 2 quotas (Pro+)

### Use Cases
- Create consistent character for content series
- Generate business personas for professional content
- Create avatars for educational videos
- Character design for storytelling
- Profile pictures and branding

### API Endpoints
- `POST /projects` - Create project
- `POST /avatars/generate` - Generate from text
- `POST /avatars/upload` - Upload custom avatar
- `POST /avatars/from-preset` - Generate from preset
- `GET /avatars/:id` - Get avatar details
- `PUT /avatars/:id/persona` - Update persona
- `GET /avatars/:id/usage` - Get usage history
- `GET /presets` - List presets
- `GET /persona-examples` - List persona examples

### Integration with Other Apps
- Pose Generator: Use avatar for pose generation
- Video Generator: Use avatar in AI videos
- Poster Editor: Use avatar in image compositions

---

## 5. Avatar Generator

**Purpose:** Generate avatar variations using Hugging Face Stable Diffusion

**Route:** `/api/apps/avatar-generator`
**Icon:** `sparkles`
**Dashboard Order:** 2
**Status:** Production Ready

### Features
- Hugging Face API integration
- Stable Diffusion models
- Generate variations of existing avatars
- Style transfer
- Prompt-based generation

### Database Models
- Uses Avatar models from Avatar Creator
- No dedicated models

### Credit Costs (PAYG Users)
- Avatar generation: 5-10 credits depending on model

### Quota Costs (Subscription Users)
- Standard generation: 1 quota
- Premium models: 2 quotas

### API Endpoints
- `POST /generate` - Generate avatar
- `GET /models` - List available models

### Technical Details
- Hugging Face Inference API
- API key required: `HUGGINGFACE_API_KEY`
- Async generation with status polling

---

## 6. Pose Generator

**Purpose:** Generate avatar poses for content creation

**Route:** N/A (Frontend only)
**Icon:** `user-square`
**Dashboard Order:** 3
**Status:** Production Ready (Frontend)

### Features
- Pose template library
- Apply poses to avatars
- Pose customization
- Preview before generation

### Backend Implementation
- No dedicated backend routes
- May use pose template API
- Future: Full backend implementation planned

### Use Cases
- Generate avatar poses for videos
- Create consistent character poses
- Professional presentation avatars
- Educational content avatars

---

## 7. Poster Editor

**Purpose:** AI-powered image editing and inpainting with SAM integration

**Route:** N/A (Frontend only)
**Icon:** `image`
**Dashboard Order:** 4
**Status:** Production Ready (Frontend)

### Features
- Image upload and editing
- AI-powered inpainting
- SAM (Segment Anything Model) integration
- Dual AI mode:
  - Quick Edit: Fast edits with basic AI
  - Advanced Edit: High-quality with premium models
- Object removal
- Background replacement
- Smart selections

### Backend Implementation
- Frontend-only currently
- Uses external SAM server: `SAM_SERVER_URL`
- Future: Full backend API planned

### Planned Credit Costs
- Quick edit: 3-5 credits
- Advanced edit: 10-15 credits
- SAM segmentation: +2 credits

### Use Cases
- Remove objects from images
- Replace backgrounds
- Clean up product photos
- Edit marketing materials
- Enhance social media images

### Technical Details
- SAM server integration
- Multiple AI model providers (planned)
- Canvas-based editor
- Real-time preview

---

## 8. Video Generator

**Purpose:** AI-powered text-to-video generation with multiple models

**Route:** N/A (Frontend only)
**Icon:** `film`
**Dashboard Order:** 8
**Status:** Production Ready (Frontend)

### Features
- Text-to-video generation
- Multiple AI models:
  - **Google Veo 3** (Pro tier)
  - **Kling 2.5** (Pro tier)
  - **Wan 2.2** (Basic tier)
  - More models planned
- Resolution options: 480p, 720p, 1080p
- Duration options: 3s, 5s, 10s
- Aspect ratios: 16:9, 9:16, 1:1
- Style presets

### Backend Implementation
- Frontend-only currently
- Future: Full backend API with model registry

### Planned Credit Costs (PAYG)
- 3-second video: 10 credits
- 5-second video: 15 credits
- 10-second video: 30 credits
- Premium models: +10 credits
- 1080p: +5 credits

### Planned Quota Costs (Subscription)
- Standard video (5s, 720p): 1 quota
- Premium video (10s, 1080p, Veo 3): 3-5 quotas

### Use Cases
- Create short social media videos
- Generate video content from scripts
- Prototype video ideas
- Create animated clips
- Marketing video snippets

### Technical Details
- Multiple AI provider integration planned
- AI Model Registry system
- Tier-based model access
- Async generation with polling

---

## Common Features Across All Apps

### Project Management
- All apps use project-based organization
- Projects contain:
  - Name and description
  - User ownership
  - Created/updated timestamps
  - Related assets and generations

### Generation System
- Async generation with background queue (BullMQ + Redis)
- Generation status tracking:
  - `pending`: Queued
  - `processing`: In progress
  - `completed`: Finished successfully
  - `failed`: Error occurred
- Real-time status polling
- Download links for outputs

### Credit/Quota System
- PAYG users: Deduct credits before generation
- Subscription users: Check quota availability
- Transaction history tracking
- Usage analytics

### File Management
- Upload to: `./uploads/{userId}/{appId}/{projectId}/`
- Output to: `./uploads/outputs/{userId}/{appId}/{generationId}/`
- Support for images and videos
- File size limits (configurable)
- MIME type validation

### Security
- Authentication required (JWT)
- Role-based access control
- Rate limiting per app
- User ownership validation
- Storage quota tracking

---

## App Development Status

### Fully Implemented (Backend + Frontend)
1. **Video Mixer** - Complete with 4 database models
2. **Carousel Mix** - Complete with 5 database models
3. **Looping Flow** - Complete with 4 database models
4. **Avatar Creator** - Complete with 6 database models
5. **Avatar Generator** - Complete with Hugging Face integration

### Frontend-Only (Backend Planned)
6. **Pose Generator** - Frontend ready, backend planned
7. **Poster Editor** - Frontend ready, SAM integration active
8. **Video Generator** - Frontend ready, model registry planned

---

## Adding New Apps

See: [Adding New Apps Guide](../ADD_NEW_APP_PROMPT.md)

**Required Steps:**
1. Create plugin config with metadata
2. Define database models (if needed)
3. Implement routes and services
4. Add to app registry
5. Create frontend component
6. Configure credits/quotas
7. Add to dashboard

---

## App Performance Metrics

### Video Processing
- Video Mixer: 5-15 minutes per 10 videos (depends on settings)
- Looping Flow: 2-5 minutes per loop (depends on duration)

### AI Generation
- Avatar Creator: 30-90 seconds per avatar (FLUX.1-dev)
- Avatar Generator: 20-60 seconds (Hugging Face)
- Video Generator (planned): 2-5 minutes per video

### Image Processing
- Carousel Mix: 1-2 minutes per 10 carousels
- Poster Editor (planned): 10-30 seconds per edit

---

## Storage Requirements

### Per User Average
- Video Mixer: 500MB - 2GB per project
- Carousel Mix: 50-200MB per project
- Looping Flow: 100-500MB per project
- Avatar Creator: 10-50MB per project
- Other apps: 10-100MB per project

### Total System (1000 users)
- Estimated: 50GB - 500GB
- Recommendation: 1TB minimum storage
- Cloud storage migration recommended for scale

---

## Future Enhancements

### Short-term (Q4 2025)
- Complete backend for Video Generator
- Complete backend for Poster Editor
- Complete backend for Pose Generator
- Enable credits for Avatar Creator
- Add more AI model options

### Medium-term (Q1 2026)
- App collaboration features
- Template marketplace
- Advanced analytics per app
- API access for developers
- Mobile app support

### Long-term (Q2 2026+)
- Real-time collaboration
- AI model fine-tuning
- Custom model upload
- Enterprise app customization
- White-label options

---

## Related Documentation

- **[Architecture Overview](../architecture/overview.md)** - Complete system architecture
- **[API Reference](../api/README.md)** - All API endpoints
- **[Subscription System](../architecture/subscription-system.md)** - Pricing and quotas
- **[Plugin Architecture](../PLUGIN_ARCHITECTURE.md)** - How apps are structured
- **[Development Guide](../development/development-guide.md)** - Development workflow

---

**Document Status:** Current
**Last Updated:** 2025-10-14
**Apps Documented:** 8/8
**Maintainer:** Technical Team
