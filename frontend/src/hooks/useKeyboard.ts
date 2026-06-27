import { useEffect } from 'react'

export function useKeyboard(keyMap: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = keyMap[e.key]
      if (action) action()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyMap])
}
