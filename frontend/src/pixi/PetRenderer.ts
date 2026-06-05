import * as PIXI from 'pixi.js'
import { PetState, PetStateType, type PetAction } from './PetState'
import { PetAnimation, DEFAULT_CLIPS, STATE_TO_ANIMATION, type AnimationClip, type AnimationPlayOptions } from './PetAnimation'
import { PetActionManager, type InteractionType } from './PetActionManager'

// ── Types ────────────────────────────────────────────────────

export interface PetRendererConfig {
  /** Width of a single sprite frame in pixels */
  frameWidth: number
  /** Height of a single sprite frame in pixels */
  frameHeight: number
  /** Total frames in the sprite sheet */
  totalFrames: number
  /** Display scale factor */
  scale: number
  /** Initial X position (fraction of screen width, 0-1) */
  initialXFraction: number
  /** Initial Y position from bottom (fraction of screen height, 0-1) */
  initialYFraction: number
  /** Pet animation speed multiplier */
  animationSpeed: number
  /** Background color (0 = transparent) */
  backgroundColor: number
  /** Whether the pet can be dragged */
  draggable: boolean
  /** Whether the pet auto-walks */
  autoWalk: boolean
}

const DEFAULT_CONFIG: PetRendererConfig = {
  frameWidth: 32,
  frameHeight: 32,
  totalFrames: 16,
  scale: 3,
  initialXFraction: 0.5,
  initialYFraction: 0.2,
  animationSpeed: 1.0,
  backgroundColor: 0x000000,
  draggable: true,
  autoWalk: true,
}

export type RendererEventType = 'state_changed' | 'animation_changed' | 'position_changed' | 'click' | 'double_click' | 'drag'

export type RendererEventListener = (event: RendererEventType, data?: any) => void

// ── PetRenderer ──────────────────────────────────────────────

export class PetRenderer {
  // Core PixiJS
  private _app: PIXI.Application
  private _container: PIXI.Container

  // Subsystems
  private _state: PetState
  private _animation: PetAnimation
  private _actionManager: PetActionManager

  // Config
  private _config: PetRendererConfig

  // Internal state
  private _sprite: PIXI.AnimatedSprite | null = null
  private _initialized: boolean = false
  private _listeners: Set<RendererEventListener> = new Set()
  private _animFrameId: number | null = null
  private _lastTimestamp: number = 0
  private _resizeHandler: (() => void) | null = null

  // Background / shadow
  private _shadow: PIXI.Graphics | null = null

  constructor(config: Partial<PetRendererConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }

    // Create PixiJS application
    this._app = new PIXI.Application()
    this._container = new PIXI.Container()

    // Create subsystems
    this._state = new PetState()
    this._animation = new PetAnimation()
    this._actionManager = new PetActionManager(this._app, this._state, this._container)

    // Wire up state → animation mapping
    this._state.onStateChange((from, to, reason) => {
      this._onStateChange(from, to, reason)
    })

    // Wire up position change callback for dragging
    this._actionManager.onPositionChange = (x, y, vx, vy) => {
      this._emit('position_changed', { x, y, vx, vy })
    }

    // Wire up interaction events
    this._actionManager.onInteraction((type, x, y) => {
      this._onInteraction(type, x, y)
    })
  }

  // ── Initialization ────────────────────────────────────────

  async initialize(
    container: HTMLElement,
    spriteSheetUrl?: string,
  ): Promise<void> {
    if (this._initialized) return

    // Initialize PixiJS
    await this._app.init({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: this._config.backgroundColor,
      backgroundAlpha: 0,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    container.appendChild(this._app.canvas as HTMLCanvasElement)

    // Set up stage
    this._app.stage.eventMode = 'static'
    this._app.stage.hitArea = this._app.screen
    this._app.stage.addChild(this._container)

    // Handle resize
    this._resizeHandler = (): void => {
      this._handleResize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', this._resizeHandler)

    // Load sprite sheet
    if (spriteSheetUrl) {
      await this._animation.loadSpriteSheet(
        spriteSheetUrl,
        this._config.frameWidth,
        this._config.frameHeight,
        this._config.totalFrames,
      )
    }

    // Create sprite
    this._sprite = this._animation.createSprite(0.5, 1.0)
    this._sprite.alpha = 0
    this._container.addChild(this._sprite)

    // Create ground shadow
    this._shadow = new PIXI.Graphics()
    this._shadow.beginFill(0x000000, 0.15)
    this._shadow.drawEllipse(0, 0, this._config.frameWidth * this._config.scale * 0.4, 4)
    this._shadow.endFill()
    this._container.addChild(this._shadow)
    this._container.setChildIndex(this._shadow, 0)

    // Set initial position
    this._positionPet(
      container.clientWidth * this._config.initialXFraction,
      container.clientHeight * (1 - this._config.initialYFraction),
    )

    // Set scale
    this._animation.setScale(this._config.scale)

    // Start with idle animation
    this._state.force('standing')
    this._playStateAnimation('standing')

    // Fade in
    await this._fadeIn(300)

    // Start game loop
    this._initialized = true
    this._lastTimestamp = performance.now()
    this._loop(this._lastTimestamp)



    this._emit('state_changed', {
      from: null,
      to: 'standing',
    })
  }

  // ── Public API ─────────────────────────────────────────────

  get state(): PetState {
    return this._state
  }

  get animation(): PetAnimation {
    return this._animation
  }

  get isInitialized(): boolean {
    return this._initialized
  }

  get position(): { x: number; y: number } {
    return { x: this._container.x, y: this._container.y }
  }

  setPosition(x: number, y: number): void {
    this._positionPet(x, y)
  }

  get config(): PetRendererConfig {
    return { ...this._config }
  }

  updateConfig(partial: Partial<PetRendererConfig>): void {
    Object.assign(this._config, partial)
    if (partial.scale !== undefined) {
      this._animation.setScale(partial.scale)
    }
    if (partial.autoWalk !== undefined) {
      this._state.enabled = partial.autoWalk
    }
  }

  /** Trigger an action on the pet externally (e.g., from chat system). */
  triggerAction(action: PetAction): boolean {
    return this._state.transition(action, 'external')
  }

  /** Show a speech bubble above the pet. Returns when hidden. */
  async showBubble(text: string, durationMs: number = 3000): Promise<void> {
    // Decoupled from chat: pure visual effect
    // The renderer only cares about displaying the bubble
    if (!this._sprite) return

    // Create bubble
    const bubble = new PIXI.Container()
    const bg = new PIXI.Graphics()
    const txt = new PIXI.Text(text, {
      fontSize: 12,
      fill: 0x333333,
      wordWrap: true,
      wordWrapWidth: 120,
    })

    txt.position.set(10, 6)
    bg.beginFill(0xffffff, 0.95)
    bg.drawRoundedRect(0, 0, txt.width + 20, txt.height + 12, 8)
    bg.endFill()

    // Add tail triangle
    bg.beginFill(0xffffff, 0.95)
    bg.moveTo(txt.width / 2 + 20 - 6, txt.height + 12)
    bg.lineTo(txt.width / 2 + 20, txt.height + 12 + 8)
    bg.lineTo(txt.width / 2 + 20 + 6, txt.height + 12)
    bg.closePath()
    bg.endFill()

    bubble.addChild(bg)
    bubble.addChild(txt)

    const bubbleY = -(this._config.frameHeight * this._config.scale + 20)
    bubble.position.set(-txt.width / 2, bubbleY - txt.height - 20)
    bubble.alpha = 0

    this._container.addChild(bubble)

    // Fade in
    await this._animateTo(bubble, { alpha: 1 }, 150)

    // Hold
    await this._wait(durationMs)

    // Fade out
    await this._animateTo(bubble, { alpha: 0 }, 150)
    this._container.removeChild(bubble)
    bubble.destroy(true)
  }

  /** Set the sprite sheet dynamically (e.g., after generation). */
  async setSpriteSheet(
    url: string,
    frameWidth?: number,
    frameHeight?: number,
    totalFrames?: number,
  ): Promise<void> {
    await this._animation.loadSpriteSheet(
      url,
      frameWidth ?? this._config.frameWidth,
      frameHeight ?? this._config.frameHeight,
      totalFrames ?? this._config.totalFrames,
    )
    this._playStateAnimation(this._state.current)
  }

  onRendererEvent(listener: RendererEventListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  destroy(): void {
    this._initialized = false
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId)
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
    }
    this._state.destroy()
    this._animation.destroy()
    this._actionManager.destroy()
    this._listeners.clear()
    this._app.destroy(true)
  }

  // ── Game loop ─────────────────────────────────────────────

  private _loop = (timestamp: number): void => {
    if (!this._initialized) return

    const deltaMs = Math.min(timestamp - this._lastTimestamp, 100) // Cap at 100ms
    this._lastTimestamp = timestamp

    // Update state machine
    this._state.tick(deltaMs)

    // Update animation
    this._animation.update(deltaMs)

    // Update drag physics
    this._actionManager.update(deltaMs)

    // Update shadow position
    if (this._shadow && this._sprite) {
      this._shadow.x = this._sprite.x
      this._shadow.y = this._sprite.y + 2
    }

    // Continue loop
    this._animFrameId = requestAnimationFrame(this._loop)
  }

  // ── State → Animation bridge ─────────────────────────────

  private _onStateChange(from: PetStateType, to: PetStateType, reason?: string): void {
    this._playStateAnimation(to)
    this._emit('state_changed', { from, to, reason })

    // Handle sleeping: dim the sprite
    if (to === 'sleeping') {
      this._animation.setAlpha(0.6)
    } else if (from === 'sleeping') {
      this._animation.setAlpha(1.0)
    }
  }

  private _playStateAnimation(state: PetStateType): void {
    const animName = STATE_TO_ANIMATION[state]
    const clip = DEFAULT_CLIPS.find((c) => c.name === animName)
    if (clip) {
      this._animation.play(clip, { speed: this._config.animationSpeed })
    }
  }

  // ── Interaction handlers ─────────────────────────────────

  private _onInteraction(type: InteractionType, x: number, y: number): void {
    switch (type) {
      case 'click':
        this._emit('click', { x, y })
        // Brief happy reaction
        this._playAnimationOnce('happy', { speed: 1.5 })
        break
      case 'double_click':
        this._emit('double_click', { x, y })
        this._playAnimationOnce('happy', { speed: 2.0 })
        break
      case 'drag_start':
        this._emit('drag', { action: 'start', x, y })
        this._animation.setAlpha(0.9)
        break
      case 'drag_end':
        this._emit('drag', { action: 'end', x, y })
        this._animation.setAlpha(1.0)
        break
    }
  }

  private _playAnimationOnce(name: string, options: AnimationPlayOptions = {}): void {
    const clip = DEFAULT_CLIPS.find((c) => c.name === name)
    if (clip) {
      const stateClip = DEFAULT_CLIPS.find(
        (c) => c.name === STATE_TO_ANIMATION[this._state.current],
      )
      if (stateClip) {
        this._animation.queue(stateClip)
      }
      this._animation.play(clip, { ...options, force: true })
    }
  }

  // ── Position helpers ─────────────────────────────────────

  private _positionPet(x: number, y: number): void {
    this._container.x = x
    this._container.y = y
    this._clampPosition()
  }

  private _clampPosition(): void {
    const m = 0
    this._container.x = Math.max(
      m,
      Math.min(this._app.screen.width - m, this._container.x),
    )
    this._container.y = Math.max(
      m,
      Math.min(this._app.screen.height - m, this._container.y),
    )
  }

  private _handleResize(width: number, height: number): void {
    this._app.renderer.resize(width, height)
    if (this._app.stage.hitArea instanceof PIXI.Rectangle) {
      this._app.stage.hitArea.width = width
      this._app.stage.hitArea.height = height
    }
    this._clampPosition()
  }

  // ── Animation helpers ────────────────────────────────────

  private _fadeIn(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this._sprite) {
        resolve()
        return
      }
      this._animateTo(this._sprite!, { alpha: 1 }, durationMs).then(resolve)
    })
  }

  private _animateTo(
    target: { alpha: number },
    props: Partial<{ alpha: number }>,
    durationMs: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startAlpha = target.alpha
      const endAlpha = props.alpha ?? startAlpha
      const startTime = performance.now()

      const tick = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / durationMs, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        target.alpha = startAlpha + (endAlpha - startAlpha) * eased

        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          resolve()
        }
      }
      tick()
    })
  }

  private _wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ── Event helpers ────────────────────────────────────────

  private _emit(event: RendererEventType, data?: any): void {
    for (const listener of this._listeners) {
      listener(event, data)
    }
  }
}

