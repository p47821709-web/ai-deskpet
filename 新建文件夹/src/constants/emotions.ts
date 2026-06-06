export const EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised', 'tired', 'excited', 'confused'
] as const

export type Emotion = (typeof EMOTIONS)[number]
