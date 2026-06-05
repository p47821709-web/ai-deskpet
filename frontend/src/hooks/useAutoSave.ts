import { useEffect } from 'react'

export function useAutoSave(data: any, key: string) {
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(key, JSON.stringify(data))
    }, 30000)
    return () => clearInterval(timer)
  }, [data, key])
}
