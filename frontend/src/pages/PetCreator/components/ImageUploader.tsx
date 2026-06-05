import React, { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, Image as ImageIcon, X, AlertCircle, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import {
  isValidImageFile,
  isFileSizeValid,
  formatFileSize,
  MAX_FILE_SIZE_MB,
} from '@/utils/validators'

interface ImageUploaderProps {
  onFileSelected: (file: File, previewUrl: string) => void
  onFileRemoved: () => void
  disabled?: boolean
  selectedFile?: File | null
  previewUrl?: string | null
}

type DragState = 'idle' | 'dragging' | 'error'

interface ValidationError {
  type: 'format' | 'size'
  message: string
}

export default function ImageUploader({
  onFileSelected,
  onFileRemoved,
  disabled = false,
  selectedFile,
  previewUrl,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [error, setError] = useState<ValidationError | null>(null)

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null)

      if (!isValidImageFile(file)) {
        const err: ValidationError = {
          type: 'format',
          message: '不支持的文件格式，请上传 PNG、JPG 或 WebP 格式的图片',
        }
        setError(err)
        return
      }

      if (!isFileSizeValid(file)) {
        const err: ValidationError = {
          type: 'size',
          message: '文件大小超过限制（最大 ' + str(MAX_FILE_SIZE_MB) + 'MB）',
        }
        setError(err)
        return
      }

      const url = URL.createObjectURL(file)
      onFileSelected(file, url)
    },
    [onFileSelected]
  )

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        validateAndSetFile(file)
      }
      e.target.value = ''
    },
    [validateAndSetFile]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('dragging')
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('idle')
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragState('idle')

      const file = e.dataTransfer.files?.[0]
      if (file) {
        validateAndSetFile(file)
      }
    },
    [validateAndSetFile]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setError(null)
    setDragState('idle')
    onFileRemoved()
  }, [previewUrl, onFileRemoved])

  const handleClickUpload = useCallback(() => {
    if (!disabled && !selectedFile) {
      inputRef.current?.click()
    }
  }, [disabled, selectedFile])

  if (selectedFile && previewUrl) {
    return (
      <div className="space-y-4">
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30">
          <img
            src={previewUrl}
            alt={"上传预览"}
            className="w-full h-64 object-contain"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 mr-1" />
              {"移除图片"}
            </Button>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <FileCheck className="w-3.5 h-3.5" />
            {"已选择"}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="font-medium text-foreground">{selectedFile.name}</span>
          </div>
          <span>{formatFileSize(selectedFile.size)}</span>
        </div>
      </div>
    )
  }

  const isDragging = dragState === 'dragging'

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClickUpload}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClickUpload()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-3 py-12 px-6",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div
          className={cn(
            "rounded-full p-3 transition-colors",
            isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {isDragging ? (
            <Upload className="w-8 h-8 animate-bounce" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? "释放鼠标以上传" : "点击上传或拖拽图片到这里"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {"支持 PNG、JPG、JPEG、WebP 格式，最大 " + str(MAX_FILE_SIZE_MB) + "MB"}
          </p>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-destructive">{error.type === "format" ? "格式错误" : "文件过大"}</p>
            <p className="text-destructive/80 mt-0.5">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
