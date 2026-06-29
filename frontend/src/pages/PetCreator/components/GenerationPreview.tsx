import React from 'react'
import { CheckCircle, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GenerateResult } from '@/services/api/generationApi'

interface GenerationPreviewProps {
  result: GenerateResult
  onSpawnToDesktop?: (imageUrl: string) => void
  spawning?: boolean
}

export default function GenerationPreview({
  result,
  onSpawnToDesktop,
  spawning = false,
}: GenerationPreviewProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">生成成功</h3>
          <p className="text-xs text-muted-foreground">
            AI 已为你生成像素风桌宠
          </p>
        </div>
      </div>

      {/* Generated Image */}
      <div className="flex justify-center">
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/10 p-4">
          {result.generated_image_url ? (
            <img
              src={result.generated_image_url}
              alt="生成的像素桌宠"
              className="max-w-[200px] max-h-[200px] image-pixelated rounded-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center text-muted-foreground text-sm">
              无预览图
            </div>
          )}
          {/* Pixel grid overlay indicator */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            {result.pixel_size}x{result.pixel_size}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="rounded-lg bg-background px-3 py-2">
          <span className="block text-foreground font-medium">{result.pixel_size}x{result.pixel_size}</span>
          <span>像素尺寸</span>
        </div>
        <div className="rounded-lg bg-background px-3 py-2">
          <span className="block text-foreground font-medium capitalize">{result.image_provider}</span>
          <span>生图供应商</span>
        </div>
        <div className="rounded-lg bg-background px-3 py-2 col-span-2">
          <span className="block text-foreground font-medium truncate" title={result.image_model}>{result.image_model}</span>
          <span>生图模型</span>
        </div>
      </div>

      {/* Action: Spawn to desktop */}
      {onSpawnToDesktop && (
        <Button
          className="w-full gap-2"
          onClick={() => onSpawnToDesktop(result.generated_image_url)}
          disabled={spawning || !result.generated_image_url}
        >
          <Monitor className="w-4 h-4" />
          {spawning ? '召唤中...' : '召唤到桌面'}
        </Button>
      )}
    </div>
  )
}