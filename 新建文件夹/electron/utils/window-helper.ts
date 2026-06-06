import { BrowserWindow, screen } from 'electron'

export function getCenterPosition(): { x: number; y: number } {
  const cursor = screen.getCursorScreenPoint()
  const currentDisplay = screen.getDisplayNearestPoint(cursor)
  const { x, y, width, height } = currentDisplay.workArea
  return { x: x + Math.floor(width / 2), y: y + Math.floor(height / 2) }
}
