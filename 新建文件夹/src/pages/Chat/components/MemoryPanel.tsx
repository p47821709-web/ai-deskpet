import React from 'react'

interface MemoryPanelProps {
  petId: string
  onClose?: () => void
}

export default function MemoryPanel({ petId, onClose }: MemoryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">🧠 记忆</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span>💡</span>
          <span>桌宠会在聊天中逐渐了解你，把重要的事情记住</span>
        </div>

        {/* Empty state */}
        <div className="text-center py-8">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-xs text-muted-foreground">还没有记忆</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            多和桌宠聊天，它会记住你们的故事
          </p>
        </div>
      </div>
    </div>
  )
}
