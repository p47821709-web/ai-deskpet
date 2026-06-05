import React from 'react'

const SHORTCUTS = [
  { keys: ['Ctrl', 'Shift', 'P'], desc: '显示/隐藏桌宠' },
  { keys: ['Ctrl', 'Shift', 'C'], desc: '打开聊天窗口' },
  { keys: ['Ctrl', 'Shift', 'S'], desc: '打开设置' },
]

export default function ShortcutSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">快捷键</h3>
      <div className="space-y-2">
        {SHORTCUTS.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
          >
            <span className="text-sm">{s.desc}</span>
            <div className="flex gap-1">
              {s.keys.map((k, j) => (
                <kbd
                  key={j}
                  className="px-2 py-0.5 text-[11px] font-mono bg-background border border-border rounded-md"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
