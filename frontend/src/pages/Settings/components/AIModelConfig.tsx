import React, { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/useSettingsStore'

// ── 对话模型供应商 ──
const CHAT_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultBase: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { value: 'deepseek', label: 'DeepSeek', defaultBase: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { value: 'doubao', label: '豆包 (火山方舟)', defaultBase: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-vision-pro-32k' },
  { value: 'custom', label: '自定义', defaultBase: '', defaultModel: '' },
]

// ── 生图模型供应商 ──
const IMAGE_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultBase: 'https://api.openai.com/v1', defaultModel: 'dall-e-3' },
  { value: 'doubao', label: '豆包 (火山方舟)', defaultBase: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-seedream-5-0-260128' },
  { value: 'custom', label: '自定义', defaultBase: '', defaultModel: '' },
]

// ── 单个配置区域组件 ──
interface ConfigSectionProps {
  title: string
  description: string
  providers: typeof CHAT_PROVIDERS
  config: { provider: string; apiBase: string; apiKey: string; model: string }
  localKey: string
  onLocalKeyChange: (val: string) => void
  onProviderChange: (provider: string) => void
  onApiBaseChange: (val: string) => void
  onModelChange: (val: string) => void
  onSave: () => void
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  onTest: () => void
}

function ConfigSection({
  title,
  description,
  providers,
  config,
  localKey,
  onLocalKeyChange,
  onProviderChange,
  onApiBaseChange,
  onModelChange,
  onSave,
  testStatus,
  onTest,
}: ConfigSectionProps) {
  return (
    <section className="space-y-4 p-4 rounded-xl border border-border bg-card/50">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Provider selection */}
      <div className="grid grid-cols-4 gap-2">
        {providers.map((p) => (
          <button
            key={p.value}
            onClick={() => onProviderChange(p.value)}
            className={`rounded-lg border-2 p-2.5 text-left transition-all ${
              config.provider === p.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <p className="text-xs font-medium">{p.label}</p>
          </button>
        ))}
      </div>

      {/* API 地址 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">API 地址</label>
        <Input
          value={config.apiBase}
          onChange={(e) => onApiBaseChange(e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </div>

      {/* API Key */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">API Key</label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={localKey}
            onChange={(e) => onLocalKeyChange(e.target.value)}
            placeholder="sk-..."
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={onSave}>
            保存
          </Button>
        </div>
      </div>

      {/* 模型名称 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">模型名称</label>
        <Input
          value={config.model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={config.provider === 'openai' ? 'gpt-4o-mini' : ''}
        />
      </div>

      {/* 测试连接 */}
      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testStatus === 'testing' || !localKey}
          className="gap-2 text-xs"
        >
          {testStatus === 'testing' && (
            <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          )}
          {testStatus === 'success' && '\u2705'}
          {testStatus === 'error' && '\u274C'}
          {testStatus === 'idle' && '\uD83D\uDD0C'}
          {testStatus === 'testing'
            ? '测试中...'
            : testStatus === 'success'
            ? '连接成功'
            : testStatus === 'error'
            ? '连接失败'
            : '测试连接'}
        </Button>
      </div>
    </section>
  )
}

// ── 主组件 ──
export default function AIModelConfig() {
  const chatAI = useSettingsStore((s) => s.chatAI)
  const imageAI = useSettingsStore((s) => s.imageAI)
  const updateChatAI = useSettingsStore((s) => s.updateChatAI)
  const updateImageAI = useSettingsStore((s) => s.updateImageAI)

  const [chatKey, setChatKey] = useState(chatAI.apiKey)
  const [imageKey, setImageKey] = useState(imageAI.apiKey)
  const [chatTestStatus, setChatTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [imageTestStatus, setImageTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  // ── 对话模型处理 ──
  const handleChatProviderChange = useCallback(
    (provider: string) => {
      const p = CHAT_PROVIDERS.find((x) => x.value === provider)
      if (p) {
        updateChatAI({
          provider,
          apiBase: p.defaultBase || chatAI.apiBase,
          model: p.defaultModel || chatAI.model,
        })
      }
    },
    [chatAI, updateChatAI],
  )

  const handleChatSave = useCallback(() => {
    updateChatAI({ apiKey: chatKey })
    setChatTestStatus('idle')
  }, [chatKey, updateChatAI])

  const handleChatTest = useCallback(async () => {
    setChatTestStatus('testing')
    updateChatAI({ apiKey: chatKey })
    try {
      const response = await fetch(`${chatAI.apiBase}/models`, {
        headers: { Authorization: `Bearer ${chatKey}` },
        signal: AbortSignal.timeout(10000),
      })
      setChatTestStatus(response.ok ? 'success' : 'error')
    } catch {
      setChatTestStatus('error')
    }
  }, [chatAI.apiBase, chatKey, updateChatAI])

  // ── 生图模型处理 ──
  const handleImageProviderChange = useCallback(
    (provider: string) => {
      const p = IMAGE_PROVIDERS.find((x) => x.value === provider)
      if (p) {
        updateImageAI({
          provider,
          apiBase: p.defaultBase || imageAI.apiBase,
          model: p.defaultModel || imageAI.model,
        })
      }
    },
    [imageAI, updateImageAI],
  )

  const handleImageSave = useCallback(() => {
    updateImageAI({ apiKey: imageKey })
    setImageTestStatus('idle')
  }, [imageKey, updateImageAI])

  const handleImageTest = useCallback(async () => {
    setImageTestStatus('testing')
    updateImageAI({ apiKey: imageKey })
    try {
      const response = await fetch(`${imageAI.apiBase}/models`, {
        headers: { Authorization: `Bearer ${imageKey}` },
        signal: AbortSignal.timeout(10000),
      })
      setImageTestStatus(response.ok ? 'success' : 'error')
    } catch {
      setImageTestStatus('error')
    }
  }, [imageAI.apiBase, imageKey, updateImageAI])

  return (
    <div className="space-y-6">
      {/* 对话模型配置 */}
      <ConfigSection
        title="对话模型配置"
        description="用于视觉分析和对话生成，推荐使用 DeepSeek"
        providers={CHAT_PROVIDERS}
        config={chatAI}
        localKey={chatKey}
        onLocalKeyChange={setChatKey}
        onProviderChange={handleChatProviderChange}
        onApiBaseChange={(v) => updateChatAI({ apiBase: v })}
        onModelChange={(v) => updateChatAI({ model: v })}
        onSave={handleChatSave}
        testStatus={chatTestStatus}
        onTest={handleChatTest}
      />

      {/* 生图模型配置 */}
      <ConfigSection
        title="生图模型配置"
        description="用于像素艺术图片生成，推荐使用豆包 Seedream 5.0"
        providers={IMAGE_PROVIDERS}
        config={imageAI}
        localKey={imageKey}
        onLocalKeyChange={setImageKey}
        onProviderChange={handleImageProviderChange}
        onApiBaseChange={(v) => updateImageAI({ apiBase: v })}
        onModelChange={(v) => updateImageAI({ model: v })}
        onSave={handleImageSave}
        testStatus={imageTestStatus}
        onTest={handleImageTest}
      />
    </div>
  )
}