import React, { useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useSettingsStore } from '@/stores/useSettingsStore'
import GeneralSettings from './components/GeneralSettings'
import AIModelConfig from './components/AIModelConfig'
import PetBehavior from './components/PetBehavior'
import AboutPanel from './components/AboutPanel'

export default function Settings() {
  const initialize = useSettingsStore((s) => s.initialize)
  const initialized = useSettingsStore((s) => s.initialized)

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置中心</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理 AI 配置、桌宠外观、系统行为
        </p>
      </div>

      {/* Main settings tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto space-x-6">
          <TabsTrigger
            value="general"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1"
          >
            通用
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1"
          >
            AI 模型
          </TabsTrigger>
          <TabsTrigger
            value="pet"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1"
          >
            桌宠
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1"
          >
            关于
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <AIModelConfig />
        </TabsContent>

        <TabsContent value="pet" className="mt-0">
          <PetBehavior />
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          <AboutPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
