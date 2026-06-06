import React, { useState, useCallback } from 'react'
import { ArrowRight, Wand2, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImageUploader from './components/ImageUploader'
import CropPreview from './components/CropPreview'
import StyleSelector from './components/StyleSelector'
import GenerationPreview from './components/GenerationPreview'
import { generatePixelArt, type UploadResult, type GenerateResult } from '@/services/api/generationApi'
import { petApi } from '@/services/api/petApi'
import { ipcBridge } from '@/services/ipc-bridge'

export default function PetCreator() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<string>('pixel_art')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // 生成状态
  const [genState, setGenState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [genResult, setGenResult] = useState<GenerateResult | null>(null)
  const [genError, setGenError] = useState('')

  // 召唤状态
  const [spawning, setSpawning] = useState(false)

  const handleFileSelected = useCallback((selectedFile: File, url: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selectedFile)
    setPreviewUrl(url)
    setUploadResult(null)
    setGenState('idle')
    setGenResult(null)
  }, [previewUrl])

  const handleFileRemoved = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setUploadResult(null)
    setGenState('idle')
    setGenResult(null)
  }, [previewUrl])

  const handleUploadSuccess = useCallback((result: UploadResult) => {
    setUploadResult(result)
  }, [])

  const handleUploadError = useCallback((error: string) => {
    console.error('[PetCreator] Upload error:', error)
  }, [])

  const handleStyleChange = useCallback((newStyle: string) => {
    setStyle(newStyle)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!uploadResult) return

    setGenState('generating')
    setGenError('')

    try {
      const result = await generatePixelArt({
        file_url: uploadResult.file_url,
        pixel_size: 32,
        style,
      })
      setGenResult(result)
      setGenState('success')
      console.log('[PetCreator] Pet generated successfully')

      // 自动创建桌宠记录
      try {
        await petApi.create({
          name: '我的桌宠',
          image_url: result.generated_image_url,
          style,
          pixel_size: result.pixel_size,
        })
      } catch (createErr) {
        console.warn('[PetCreator] Failed to create pet record:', createErr)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '生成失败'
      setGenError(msg)
      setGenState('error')
      console.error('[PetCreator] Generation failed:', msg)
    }
  }, [uploadResult, style])

  const handleSpawnToDesktop = useCallback((_imageUrl: string) => {
    setSpawning(true)
    try {
      // 通过 IPC 通知主进程创建桌宠窗口
      ipcBridge.spawnPet('default')
      console.log('[PetCreator] Spawn pet to desktop')
    } catch (err) {
      console.error('[PetCreator] Failed to spawn pet:', err)
    } finally {
      setSpawning(false)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">创建桌宠</h1>
        <p className="text-sm text-muted-foreground">
          上传图片，AI 将自动生成像素风桌宠
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        {['上传图片', '选择风格', '生成桌宠'].map((step, i) => {
          const isDone =
            (i === 0 && file) ||
            (i === 1 && uploadResult !== null) ||
            (i === 2 && genState === 'success')
          const isActive =
            (i === 1 && file && !uploadResult) ||
            (i === 2 && uploadResult && genState === 'idle')
          const isError = i === 2 && genState === 'error'

          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={
                  'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ' +
                  (isDone
                    ? 'bg-primary text-primary-foreground'
                    : isError
                    ? 'bg-destructive text-destructive-foreground'
                    : isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground')
                }
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={
                  'text-sm ' +
                  (isDone || isActive ? 'font-medium text-foreground' : 'text-muted-foreground')
                }
              >
                {step}
              </span>
              {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground/40" />}
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">上传图片</h3>
            <p className="text-xs text-muted-foreground">
              推荐使用角色、宠物或人物头像图片进行生成
            </p>
          </div>

          <ImageUploader
            onFileSelected={handleFileSelected}
            onFileRemoved={handleFileRemoved}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            disabled={genState === 'generating'}
            selectedFile={file}
            previewUrl={previewUrl}
          />
        </div>

        {/* Right: Preview + Style */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">预览与风格</h3>
            <p className="text-xs text-muted-foreground">
              检查图片是否正确，并选择生成风格
            </p>
          </div>

          <CropPreview file={file} previewUrl={previewUrl} />

          <StyleSelector value={style} onChange={handleStyleChange} />
        </div>
      </div>

      {/* Generation result */}
      {genResult && (
        <div className="max-w-sm mx-auto">
          <GenerationPreview
            result={genResult}
            onSpawnToDesktop={handleSpawnToDesktop}
            spawning={spawning}
          />
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end pt-4 border-t border-border">
        {genState === 'success' ? (
          <Button size="lg" variant="outline" disabled className="gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            生成完成
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!uploadResult || genState === 'generating'}
            onClick={handleGenerate}
            className="gap-2"
          >
            {genState === 'generating' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                开始生成
              </>
            )}
          </Button>
        )}
      </div>

      {/* 生成错误提示 */}
      {genState === 'error' && genError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {genError}
        </div>
      )}
    </div>
  )
}
