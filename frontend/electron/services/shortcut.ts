import { globalShortcut } from 'electron'

export function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    // Toggle pet
  })
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    // Toggle chat
  })
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll()
}
