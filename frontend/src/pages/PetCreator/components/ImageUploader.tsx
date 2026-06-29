import React, { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, Image as ImageIcon, X, AlertCircle, FileCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import {
  isValidImageFile,
  isFileSizeValid,
  formatFileSize,
  MAX_FILE_SIZE_MB,
} from '@/utils/validators'
import { uploadImage, type UploadResult } from '@/services/api/generationApi'

interface ImageUploaderProps {
  onFileSelected: (file: File, previewUrl: string) => void
  onFileRemoved: () => void
  onUploadSuccess?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
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
  onUploadSuccess,
  onUploadError,
  disabled = false,
  selectedFile,
  previewUrl,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const [error, setError] = useState<ValidationError | null>(null)

  // 上传状态
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadErrorMsg, setUploadErrorMsg] = useState('')

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadState('uploading')
      setUploadProgress(0)
      setUploadErrorMsg('')

      try {
        const result = await uploadImage(file, (percent) => {
          setUploadProgress(percent)
        })
        setUploadState('success')
        setUploadProgress(100)
        onUploadSuccess?.(result)
      } catch (err: any) {
        setUploadState('error')
        const msg = err?.response?.data?.message || err?.message || '上传失败，请重试'
        setUploadErrorMsg(msg)
        onUploadError?.(msg)
      }
    },
    [onUploadSuccess, onUploadError]
  )

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null)
      setUploadState('idle')
      setUploadProgress(0)
      setUploadErrorMsg('')

      if (!isValidImageFile(file)) {
        setError({
          type: 'format',
          message: '不支持的文件格式，请上传 PNG、JPG 或 WebP 格式的图片',
        })
        return
      }

      if (!isFileSizeValid(file)) {
        setError({
          type: 'size',
          message: '文件大小超过限制（最大 ' + String(MAX_FILE_SIZE_MB) + 'MB）',
        })
        return
      }

      const url = URL.createObjectURL(file)
      onFileSelected(file, url)

      // 自动上传到后端
      handleUpload(file)
    },
    [onFileSelected, handleUpload]
  )

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) validateAndSetFile(file)
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
      if (file) validateAndSetFile(file)
    },
    [validateAndSetFile]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setError(null)
    setDragState('idle')
    setUploadState('idle')
    setUploadProgress(0)
    setUploadErrorMsg('')
    onFileRemoved()
  }, [previewUrl, onFileRemoved])

  const handleClickUpload = useCallback(() => {
    if (!disabled && !selectedFile) inputRef.current?.click()
  }, [disabled, selectedFile])

  // ── 已选择 + 上传状态显示 ──
  if (selectedFile && previewUrl) {
    return (
      <div className="space-y-4">
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30">
          <img
            src={previewUrl}
            alt="上传预览"
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
              移除图片
            </Button>
          </div>

          {/* 上传状态标签 */}
          <div className="absolute top-3 left-3">
            {uploadState === 'uploading' && (
              <div className="flex items-center gap-1.5 bg-blue-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {'上传中 ' + uploadProgress + '%'}
              </div>
            )}
            {uploadState === 'success' && (
              <div className="flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <FileCheck className="w-3.5 h-3.5" />
                已上传
              </div>
            )}
            {uploadState === 'error' && (
              <div className="flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                上传失败
              </div>
            )}
            {uploadState === 'idle' && (
              <div className="flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                <FileCheck className="w-3.5 h-3.5" />
                已选择
              </div>
            )}
          </div>
        </div>

        {/* 上传进度条 */}
        {uploadState === 'uploading' && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: uploadProgress + '%' }}
            />
          </div>
        )}

        {/* 上传失败提示 */}
        {uploadState === 'error' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-300">
              <span className="font-medium">上传失败：</span>
              {uploadErrorMsg}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto px-2 py-0.5 text-xs"
              onClick={() => handleUpload(selectedFile)}
            >
              重试
            </Button>
          </div>
        )}

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

  // ── 空状态（上传按钮） ──
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
          if (e.key === 'Enter' || e.key === ' ') handleClickUpload()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 px-6 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20'
        )}
      >
        <div
          className={cn(
            'rounded-full p-4 mb-3 transition-colors',
            isDragging ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Upload
            className={cn(
              'w-8 h-8 transition-colors',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <p className="text-sm font-medium mb-1">
          {isDragging ? '松开以上传' : '点击上传或拖拽图片到此处'}
        </p>
        <p className="text-xs text-muted-foreground">
          支持 PNG、JPG、WebP 格式，最大 ' + String(MAX_FILE_SIZE_MB) + 'MB
        </p>
      </div>

      {/* 校验错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error.message}</p>
        </div>
      )}
    </div>
  )
}
