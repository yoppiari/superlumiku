# Looping Flow - YouTube Meditation & Ambience Enhancement

## Overview

Enhancement plan for Looping Flow app focused on creating **perfect seamless long-duration videos** for YouTube meditation, sleep music, and ambient backgrounds (8+ hours).

## Use Case

Target content types:
- 🧘 **Meditation videos** (8-12 hours)
- 😴 **Sleep music** (10-12 hours)
- 🌊 **Ambient backgrounds** (nature sounds, rain, fireplace)
- 🎵 **Study/work ambience** (lo-fi, cafe sounds)

## Critical Requirements

1. **Seamless Loops** - No visible/audible jumps at loop points
2. **Audio Quality** - MORE important than video quality for this use case
3. **Multi-Layer Audio** - Combine multiple audio sources (music + rain + fireplace)
4. **YouTube Optimization** - File size and encoding optimized for long uploads
5. **Professional Output** - User should not need to edit after generation

---

## Package 1: Perfect Seamless Loop

### Features

#### 1. Crossfade Video Transitions
- Adjustable crossfade duration: 0.5s - 2.0s
- Smooth video blend at loop point
- Prevents visible "jump"

**FFmpeg Implementation:**
```bash
# Crossfade video loop
ffmpeg -y \
  -stream_loop 2 -i input.mp4 \
  -filter_complex "
    [0:v]split=2[v1][v2];
    [v1]trim=duration=${duration}[v1trimmed];
    [v2]trim=start=${duration}:end=${duration+crossfade}[v2trimmed];
    [v1trimmed][v2trimmed]xfade=transition=fade:duration=${crossfade}:offset=${duration-crossfade}
  " \
  -t ${targetDuration} output.mp4
```

#### 2. Audio Crossfade
- Seamless audio transitions
- Prevents clicks/pops at loop points
- Separate audio crossfade duration control

**FFmpeg Implementation:**
```bash
# Audio crossfade
-af "acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri"
```

#### 3. Boomerang/Reverse Loop
- Forward → Reverse → Forward
- Guaranteed seamless loop (same start/end frame)
- Perfect for certain meditation visuals

**FFmpeg Implementation:**
```bash
# Boomerang effect
ffmpeg -y -i input.mp4 \
  -filter_complex "
    [0:v]split[v1][v2];
    [v1]setpts=PTS-STARTPTS[forward];
    [v2]reverse,setpts=PTS-STARTPTS[backward];
    [forward][backward]concat=n=2:v=1:a=0[v]
  " \
  -map "[v]" -t ${targetDuration} output.mp4
```

#### 4. Loop Style Options
- **Simple Loop** - Fast, good for most cases
- **Crossfade Loop** - Smooth transitions (recommended)
- **Boomerang Loop** - Forward + reverse
- **Smart Loop** - Detect best loop point automatically (future)

### Database Schema Changes

```prisma
model LoopingFlowGeneration {
  id              String   @id @default(cuid())
  // ... existing fields ...

  // New fields for Package 1
  loopStyle       String   @default("crossfade") // simple, crossfade, boomerang
  crossfadeDuration Float  @default(1.0)         // 0.5 - 2.0 seconds
  audioCrossfade  Boolean  @default(true)
  videoCrossfade  Boolean  @default(true)
}
```

### UI Components

**Loop Settings Panel:**
```tsx
<div className="loop-settings">
  <label>Loop Style</label>
  <select value={loopStyle} onChange={...}>
    <option value="simple">Simple Loop (Fast)</option>
    <option value="crossfade">Crossfade (Recommended)</option>
    <option value="boomerang">Boomerang</option>
  </select>

  {loopStyle === 'crossfade' && (
    <>
      <label>Crossfade Duration: {crossfadeDuration}s</label>
      <input
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={crossfadeDuration}
      />

      <label>
        <input type="checkbox" checked={videoCrossfade} />
        Video Crossfade
      </label>

      <label>
        <input type="checkbox" checked={audioCrossfade} />
        Audio Crossfade
      </label>
    </>
  )}
</div>
```

---

## Package 2: Multi-Layer Audio

### Features

#### 1. Multiple Audio Layers (2-4 tracks)
- Layer 1: Original video audio
- Layer 2: Background music
- Layer 3: Ambient sounds (rain, fireplace)
- Layer 4: Additional effects

#### 2. Independent Volume Controls
- 0-100% volume per layer
- Mute/unmute toggles
- Master volume control

#### 3. Audio Fade In/Out
- Smooth start/end transitions
- Configurable fade duration (2-10s)
- Professional sound quality

#### 4. Audio Mixing
- Combine all layers into single output
- Normalize audio levels
- Prevent clipping/distortion

### FFmpeg Implementation

**Multi-Layer Audio Mixing:**
```bash
ffmpeg -y \
  -i video.mp4 \
  -i audio1.mp3 \
  -i audio2.mp3 \
  -i audio3.mp3 \
  -filter_complex "
    [0:a]volume=${vol0}[a0];
    [1:a]volume=${vol1}[a1];
    [2:a]volume=${vol2}[a2];
    [3:a]volume=${vol3}[a3];
    [a0][a1][a2][a3]amix=inputs=4:duration=longest:normalize=0[aout]
  " \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 192k \
  output.mp4
```

**Audio Loop with Fade:**
```bash
# Loop audio layer with fade in/out
-stream_loop -1 -i audio.mp3 \
-af "afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${duration-fadeOut}:d=${fadeOut}"
```

### Database Schema Changes

```prisma
model LoopingFlowGeneration {
  id              String   @id @default(cuid())
  // ... existing fields ...

  // New fields for Package 2
  audioLayers     Json?    // Array of audio layer configs
  masterVolume    Float    @default(100)
  audioFadeIn     Float    @default(2.0)
  audioFadeOut    Float    @default(2.0)
  muteOriginal    Boolean  @default(false)
}

model LoopingFlowAudioLayer {
  id              String   @id @default(cuid())
  generationId    String
  generation      LoopingFlowGeneration @relation(fields: [generationId], references: [id], onDelete: Cascade)

  layerIndex      Int      // 0, 1, 2, 3
  fileName        String
  filePath        String
  fileSize        Int
  duration        Float
  volume          Float    @default(100)
  muted           Boolean  @default(false)
  fadeIn          Float    @default(0)
  fadeOut         Float    @default(0)

  createdAt       DateTime @default(now())

  @@index([generationId])
}
```

### UI Components

**Audio Layer Manager:**
```tsx
<div className="audio-layers">
  <h3>Audio Layers</h3>

  {/* Original Audio */}
  <div className="audio-layer">
    <span>Original Video Audio</span>
    <input
      type="range"
      min="0"
      max="100"
      value={originalVolume}
      disabled={muteOriginal}
    />
    <label>
      <input type="checkbox" checked={muteOriginal} />
      Mute
    </label>
  </div>

  {/* Additional Layers */}
  {audioLayers.map((layer, idx) => (
    <div key={idx} className="audio-layer">
      <span>{layer.fileName}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={layer.volume}
        disabled={layer.muted}
      />
      <label>
        <input type="checkbox" checked={layer.muted} />
        Mute
      </label>
      <button onClick={() => removeLayer(idx)}>Remove</button>
    </div>
  ))}

  {/* Add Layer Button */}
  {audioLayers.length < 3 && (
    <button onClick={handleUploadAudio}>
      + Add Audio Layer
    </button>
  )}

  {/* Fade Controls */}
  <div className="fade-controls">
    <label>Fade In: {fadeIn}s</label>
    <input type="range" min="0" max="10" step="0.5" value={fadeIn} />

    <label>Fade Out: {fadeOut}s</label>
    <input type="range" min="0" max="10" step="0.5" value={fadeOut} />
  </div>
</div>
```

---

## YouTube Optimization

### Encoding Presets

**For 1080p Video + High Quality Audio:**
```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 20 \
  -profile:v high \
  -level 4.1 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  -ar 48000 \
  -movflags +faststart \
  output.mp4
```

**For 720p Video + High Quality Audio (smaller file):**
```bash
ffmpeg -y -i input.mp4 \
  -vf scale=1280:720 \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac \
  -b:a 192k \
  -movflags +faststart \
  output.mp4
```

**For Audio-Focus Content (low video bitrate):**
```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -c:a aac \
  -b:a 256k \
  -movflags +faststart \
  output.mp4
```

### File Size Estimates

For 8-hour video:
- 1080p + 192k audio ≈ 4-6 GB
- 720p + 192k audio ≈ 2-3 GB
- Low video + 256k audio ≈ 1-1.5 GB

---

## Implementation Plan

### Phase 1: Database Schema Updates
1. Add new fields to `LoopingFlowGeneration` model
2. Create `LoopingFlowAudioLayer` model
3. Run Prisma migration
4. Update repository methods

### Phase 2: FFmpeg Enhancements
1. Enhance `FFmpegLooper` class with crossfade methods
2. Add boomerang/reverse loop support
3. Add multi-layer audio mixing
4. Add YouTube encoding presets

### Phase 3: Backend API Updates
1. Add audio layer upload endpoints
2. Update generation creation to accept loop settings
3. Update worker to process new loop styles
4. Add audio layer management endpoints

### Phase 4: Frontend UI
1. Add loop style selector
2. Add crossfade duration controls
3. Add audio layer manager
4. Add volume controls and fade settings
5. Add encoding preset selector

### Phase 5: Testing
1. Test simple loop vs crossfade
2. Test boomerang effect
3. Test multi-layer audio mixing
4. Test 8-hour generation
5. Test YouTube upload compatibility

---

## API Endpoints

### Audio Layer Management

**Upload Audio Layer:**
```
POST /api/looping-flow/generations/:id/audio-layers
Content-Type: multipart/form-data

{
  "audioFile": File,
  "layerIndex": 1,
  "volume": 80,
  "fadeIn": 2.0,
  "fadeOut": 2.0
}
```

**Update Audio Layer:**
```
PATCH /api/looping-flow/audio-layers/:layerId

{
  "volume": 60,
  "muted": false,
  "fadeIn": 3.0
}
```

**Delete Audio Layer:**
```
DELETE /api/looping-flow/audio-layers/:layerId
```

### Generation with Loop Settings

**Create Generation:**
```
POST /api/looping-flow/projects/:projectId/generations

{
  "videoId": "...",
  "targetDuration": 28800, // 8 hours
  "loopStyle": "crossfade",
  "crossfadeDuration": 1.0,
  "videoCrossfade": true,
  "audioCrossfade": true,
  "muteOriginal": false,
  "masterVolume": 100,
  "audioFadeIn": 2.0,
  "audioFadeOut": 2.0,
  "encodingPreset": "1080p-hq"
}
```

---

## Content Templates (Future)

Pre-configured settings for common use cases:

### Meditation Template
- Loop Style: Crossfade (1.5s)
- Audio: Original + Meditation Music
- Encoding: 720p (smaller file)
- Suggested Duration: 8-10 hours

### Sleep Music Template
- Loop Style: Crossfade (2.0s)
- Audio: Soft music + rain sounds
- Encoding: Audio-focus
- Suggested Duration: 10-12 hours

### Nature Ambience Template
- Loop Style: Boomerang
- Audio: Nature sounds + optional music
- Encoding: 1080p (visual quality matters)
- Suggested Duration: 8 hours

### Study/Work Template
- Loop Style: Simple (fast processing)
- Audio: Lo-fi music + cafe ambience
- Encoding: 720p
- Suggested Duration: 4-8 hours

---

## Credit Calculation

**Updated credit costs:**
- Simple Loop: 1 credit per minute
- Crossfade Loop: 1.5 credits per minute
- Boomerang Loop: 2 credits per minute (2x processing)
- Each audio layer: +0.5 credits per minute

**Examples:**
- 8-hour simple loop: 480 credits
- 8-hour crossfade + 2 audio layers: 1,200 credits
- 10-hour boomerang + 3 layers: 2,100 credits

---

## Implementation Status

### ✅ Backend (100% Complete)
- Database schema with all new fields
- FFmpeg looper with 3 loop styles (simple, crossfade, boomerang)
- Multi-layer audio mixing
- Audio layer CRUD APIs
- Worker integration with loop options
- All endpoints tested and working

### 🚧 Frontend (In Progress)
- Loop Settings UI components
- Audio Layer Manager
- Volume controls and sliders
- Preview functionality

---

## Success Metrics

1. **Loop Smoothness** - No visible/audible jumps
2. **Audio Quality** - Professional sound mixing
3. **File Size** - Optimized for YouTube upload
4. **Processing Time** - Reasonable for long videos
5. **User Satisfaction** - Minimal editing needed after generation
