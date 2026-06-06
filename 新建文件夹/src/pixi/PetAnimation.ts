import * as PIXI from 'pixi.js'
import { PetStateType } from './PetState'

// ── Animation frame definitions ──────────────────────────────

export interface AnimationFrameDef {
  /** Frame index (column in the sprite sheet) */
  index: number
  /** Duration in milliseconds this frame is displayed */
  duration: number
}

export interface AnimationClip {
  name: string
  frames: AnimationFrameDef[]
  loop: boolean
  /** Animation speed multiplier (1.0 = normal) */
  speed: number
}

export interface AnimationLayer {
  /** Z-order within the pet display (0 = body, 1 = eyes, 2 = accessories) */
  zIndex: number
  /** Unique name for this layer */
  name: string
  /** If true, this layer participates in all animations */
  alwaysActive: boolean
  /** Animation clips available on this layer */
  clips: AnimationClip[]
}

// ── State-to-animation mapping ──────────────────────────────

export const STATE_TO_ANIMATION: Record<PetStateType, string> = {
  standing: 'idle',
  walking: 'walk',
  sleeping: 'sleep',
  dragging: 'idle',
  interacting: 'happy',
  following: 'walk',
}

// ── Default clip definitions ─────────────────────────────────

export const DEFAULT_CLIPS: AnimationClip[] = [
  {
    name: 'idle',
    frames: [
      { index: 0, duration: 1500 },
      { index: 1, duration: 100 },
      { index: 0, duration: 1500 },
      { index: 2, duration: 200 },
      { index: 0, duration: 1500 },
    ],
    loop: true,
    speed: 1.0,
  },
  {
    name: 'walk',
    frames: [
      { index: 3, duration: 200 },
      { index: 4, duration: 200 },
      { index: 5, duration: 200 },
      { index: 6, duration: 200 },
    ],
    loop: true,
    speed: 1.0,
  },
  {
    name: 'sleep',
    frames: [
      { index: 7, duration: 800 },
      { index: 8, duration: 800 },
    ],
    loop: true,
    speed: 0.5,
  },
  {
    name: 'happy',
    frames: [
      { index: 9, duration: 100 },
      { index: 10, duration: 100 },
      { index: 11, duration: 100 },
      { index: 10, duration: 100 },
      { index: 9, duration: 100 },
    ],
    loop: false,
    speed: 1.2,
  },
  {
    name: 'sad',
    frames: [
      { index: 12, duration: 400 },
      { index: 13, duration: 400 },
    ],
    loop: false,
    speed: 0.8,
  },
]

// ── PetAnimation class ───────────────────────────────────────

export interface AnimationPlayOptions {
  /** If true, this animation overrides the current state-driven animation */
  force?: boolean
  /** Callback when the animation completes (for non-looping) */
  onComplete?: () => void
  /** Playback speed multiplier */
  speed?: number
}

export type AnimationEventType = 'start' | 'frame' | 'complete' | 'loop'

export type AnimationEventListener = (
  event: AnimationEventType,
  animationName: string,
  frameIndex?: number,
) => void

export class PetAnimation {
  private _sprite: PIXI.AnimatedSprite | null = null
  private _currentClip: AnimationClip | null = null
  private _queuedClip: AnimationClip | null = null
  private _isTransitioning: boolean = false
  private _listeners: Set<AnimationEventListener> = new Set()
  private _onCompleteCallback: (() => void) | null = null
  private _flipX: boolean = false

  /** The base texture for the sprite sheet (all frames in a horizontal strip). */
  private _baseTexture: PIXI.BaseTexture | null = null
  /** Texture array for each frame. */
  private _textures: PIXI.Texture[] = []

  // ── Initialization ─────────────────────────────────────────

  async loadSpriteSheet(
    imageUrl: string,
    frameWidth: number,
    frameHeight: number,
    totalFrames: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const baseTexture = PIXI.BaseTexture.from(img)
        this._baseTexture = baseTexture
        this._textures = []

        for (let i = 0; i < totalFrames; i++) {
          const rect = new PIXI.Rectangle(
            i * frameWidth,
            0,
            frameWidth,
            frameHeight,
          )
          this._textures.push(new PIXI.Texture(baseTexture, rect))
        }

        if (this._sprite) {
          this._sprite.textures = this._textures
        }

        resolve()
      }
      img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${imageUrl}`))
      img.src = imageUrl
    })
  }

  createSprite(anchorX: number = 0.5, anchorY: number = 1.0): PIXI.AnimatedSprite {
    const sprite = new PIXI.AnimatedSprite(
      this._textures.length > 0 ? this._textures : [PIXI.Texture.WHITE],
    )
    sprite.anchor.set(anchorX, anchorY)
    sprite.animationSpeed = 0.5
    sprite.loop = true
    sprite.play()

    this._sprite = sprite
    return sprite
  }

  get sprite(): PIXI.AnimatedSprite | null {
    return this._sprite
  }

  // ── Playback control ──────────────────────────────────────

  play(
    clip: AnimationClip,
    options: AnimationPlayOptions = {},
  ): void {
    if (!this._sprite) return

    const currentName = this._currentClip?.name

    // If same clip is already playing and not forced, skip
    if (currentName === clip.name && !options.force) return

    this._onCompleteCallback = options.onComplete ?? null

    // Build frame textures for this clip
    if (this._textures.length > 0) {
      const frameTextures = clip.frames.map((f) => {
        return this._textures[f.index] ?? this._textures[0]
      })
      this._sprite.textures = frameTextures
    }

    this._sprite.animationSpeed = (options.speed ?? clip.speed) * 0.1
    this._sprite.loop = clip.loop
    this._sprite.gotoAndPlay(0)

    this._currentClip = clip
    this._isTransitioning = false

    this._emit('start', clip.name)
  }

  /** Queue an animation to play after the current one finishes. */
  queue(clip: AnimationClip): void {
    this._queuedClip = clip
  }

  stop(): void {
    if (this._sprite) {
      this._sprite.stop()
    }
    this._currentClip = null
    this._queuedClip = null
  }

  /** Must be called each frame to handle non-looping animation completion. */
  update(deltaMs: number): void {
    if (!this._sprite || !this._currentClip) return

    // Non-looping: check if animation finished
    if (
      !this._currentClip.loop &&
      this._currentClip.frames.length > 0 &&
      this._sprite.currentFrame >= this._currentClip.frames.length - 1 &&
      !this._isTransitioning
    ) {
      this._isTransitioning = true
      this._emit('complete', this._currentClip.name)

      // Fire callback
      this._onCompleteCallback?.()

      // Play queued animation
      if (this._queuedClip) {
        const next = this._queuedClip
        this._queuedClip = null
        this.play(next, { force: true })
      }
    }
  }

  // ── Transform helpers ─────────────────────────────────────

  setScale(scale: number): void {
    if (this._sprite) {
      this._sprite.scale.set(this._flipX ? -scale : scale, scale)
    }
  }

  setFlipX(flip: boolean): void {
    this._flipX = flip
    if (this._sprite) {
      this._sprite.scale.x = Math.abs(this._sprite.scale.x) * (flip ? -1 : 1)
    }
  }

  setAlpha(alpha: number): void {
    if (this._sprite) {
      this._sprite.alpha = alpha
    }
  }

  setTint(color: number): void {
    if (this._sprite) {
      this._sprite.tint = color
    }
  }

  // ── Event subscription ────────────────────────────────────

  onAnimationEvent(listener: AnimationEventListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  get currentClipName(): string | null {
    return this._currentClip?.name ?? null
  }

  get isPlaying(): boolean {
    return this._sprite?.playing ?? false
  }

  destroy(): void {
    this._listeners.clear()
  }

  private _emit(event: AnimationEventType, animationName: string, frameIndex?: number): void {
    for (const listener of this._listeners) {
      listener(event, animationName, frameIndex)
    }
  }
}
