import React, { useState, useCallback } from 'react'
import { ArrowRight, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImageUploader from './components/ImageUploader'
import CropPreview from './components/CropPreview'
import StyleSelector from './components/StyleSelector'

export default function PetCreator() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<string>('pixel_art')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelected = useCallback((selectedFile: File, url: string) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(selectedFile)
    setPreviewUrl(url)
  }, [previewUrl])

  const handleFileRemoved = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
  }, [previewUrl])

  const handleStyleChange = useCallback((newStyle: string) => {
    setStyle(newStyle)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          创建桌宠
        </h1>
        <p className="text-sm text-muted-foreground">
          上传图片，AI 将自动生成像素风桌宠
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        {['上传图片', '选择风格', '生成桌宠'].map((step, i) => {
          const isActive = i === 0 && file
            ? true
            : i === 0
            ? true
            : i === 1 && file
            ? true
            : false
          const isDone = i === 0 && file ? true : false
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={
                  'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ' +
                  (isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground')
                }
              >
                {i + 1}
              </div>
              <span
                className={
                  'text-sm ' +
                  (isDone || isActive ? 'font-medium text-foreground' : 'text-muted-foreground')
                }
              >
                {step}
              </span>
              {i < 2 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
              )}
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              上传图片
            </h3>
            <p className="text-xs text-muted-foreground">
              推荐使用布猼、宠物或人物头像图片进行生成
            </p>
          </div>

          <ImageUploader
            onFileSelected={handleFileSelected}
            onFileRemoved={handleFileRemoved}
            disabled={isUploading}
            selectedFile={file}
            previewUrl={previewUrl}
          />
        </div>

        {/* Right: Preview + Style */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              预览与风格
            </h3>
            <p className="text-xs text-muted-foreground">
              检查图片是否正确，并选择生成风格
            </p>
          </div>

          <CropPreview file={file} previewUrl={previewUrl} />

          <StyleSelector value={style} onChange={handleStyleChange} />
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          size="lg"
          disabled={!file || isUploading}
          onClick={() => {
            setIsUploading(true)
            // TODO: trigger generation
          }}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {isUploading ? '生成中...' : '开始生成'}
        </Button>
      </div>
    </div>
  )
}
