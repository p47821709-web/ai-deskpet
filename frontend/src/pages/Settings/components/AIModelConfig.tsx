import React, { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/useSettingsStore'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultBase: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { value: 'deepseek', label: 'DeepSeek', defaultBase: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { value: 'custom', label: '自定义', defaultBase: '', defaultModel: '' },
]

export default function AIModelConfig() {
  const ai = useSettingsStore((s) => s.ai)
  const updateAI = useSettingsStore((s) => s.updateAI)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [localKey, setLocalKey] = useState(ai.aiApiKey)

  const handleProviderChange = useCallback(
    (provider: string) => {
      const p = PROVIDERS.find((x) => x.value === provider)
      if (p) {
        updateAI({
          aiProvider: provider,
          aiApiBase: p.defaultBase || ai.aiApiBase,
          aiModel: p.defaultModel || ai.aiModel,
        })
      }
    },
    [ai, updateAI],
  )

  const handleSave = useCallback(() => {
    updateAI({ aiApiKey: localKey })
    setTestStatus('idle')
  }, [localKey, updateAI])

  const handleTest = useCallback(async () => {
    setTestStatus('testing')
    // Save key first
    updateAI({ aiApiKey: localKey })

    try {
      const response = await fetch(`${ai.aiApiBase}/models`, {
        headers: {
          Authorization: `Bearer ${localKey}`,
        },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        setTestStatus('success')
      } else {
        setTestStatus('error')
      }
    } catch {
      setTestStatus('error')
    }
  }, [ai.aiApiBase, localKey, updateAI])

  return (
    <div className="space-y-6">
      {/* Provider selection */}
      <section>
        <h3 className="text-sm font-semibold mb-4">AI 供应商</h3>
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleProviderChange(p.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                ai.aiProvider === p.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{p.defaultBase}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Connection settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">连接配置</h3>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">API 地址</label>
          <Input
            value={ai.aiApiBase}
            onChange={(e) => updateAI({ aiApiBase: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">API Key</label>
          <div className="flex gap-2">
            <Input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {ai.aiProvider === 'openai' ? '对话模型' : '模型名称'}
          </label>
          <Input
            value={ai.aiModel}
            onChange={(e) => updateAI({ aiModel: e.target.value })}
            placeholder={ai.aiProvider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat'}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">图片生成模型</label>
          <Input
            value={ai.aiImageModel}
            onChange={(e) => updateAI({ aiImageModel: e.target.value })}
            placeholder={ai.aiProvider === 'openai' ? 'dall-e-3' : '不支持'}
          />
          {ai.aiProvider === 'deepseek' && (
            <p className="text-[11px] text-muted-foreground/60">
              DeepSeek 不支持图片生成，将使用占位图
            </p>
          )}
        </div>
      </section>

      {/* Test connection */}
      <section className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testStatus === 'testing' || !localKey}
          className="gap-2"
        >
          {testStatus === 'testing' && (
            <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          )}
          {testStatus === 'success' && '✅'}
          {testStatus === 'error' && '❌'}
          {testStatus === 'idle' && '🔌'}
          {testStatus === 'testing'
            ? '测试中...'
            : testStatus === 'success'
            ? '连接成功'
            : testStatus === 'error'
            ? '连接失败'
            : '测试连接'}
        </Button>
      </section>
    </div>
  )
}
