export function useAnimationEngine() {
  return {
    play: (anim: string) => {},
    stop: () => {},
    setEmotion: (emotion: string) => {},
    isPlaying: false,
  }
}
