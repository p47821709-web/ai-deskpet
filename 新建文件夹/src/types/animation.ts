export interface PetAnimation {
  id: string
  petId: string
  animationType: 'idle' | 'walk' | 'jump' | 'sleep' | 'talk' | 'happy' | 'sad'
  spriteUrl: string
  frameCount: number
  frameDuration: number
  triggerType: 'auto' | 'time' | 'interaction' | 'emotion'
  triggerParams?: Record<string, any>
}

export interface AnimationState {
  type: string
  frame: number
  isPlaying: boolean
  loop: boolean
}
