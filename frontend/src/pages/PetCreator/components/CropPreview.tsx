import React from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { formatFileSize } from '@/utils/validators'

interface CropPreviewProps {
  file: File | null
  previewUrl: string | null
  onCrop?: (croppedUrl: string) => void
}

export default function CropPreview({ file, previewUrl }: CropPreviewProps) {
  if (!file || !previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 py-16 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          请先上传图片
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          上传后将在此处显示预览
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">图片预览</h4>
        <span className="text-xs text-muted-foreground">
          {file.width && file.height
            ? file.width + ' × ' + file.height
            : ''}
          {' · ' + formatFileSize(file.size)}
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border bg-muted/10">
        <div className="relative">
          <img
            src={previewUrl}
            alt="预览图"
            className="w-full h-72 object-contain"
            onLoad={(e) => {
              const img = e.currentTarget
              ;(file as any).width = img.naturalWidth
              ;(file as any).height = img.naturalHeight
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <span className="block text-foreground font-medium">
            {file.name}
          </span>
          <span>文件名</span>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <span className="block text-foreground font-medium">
            {file.type || '未知'}
          </span>
          <span>文件类型</span>
        </div>
      </div>
    </div>
  )
}
