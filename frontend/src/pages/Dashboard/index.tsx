import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">🐾 AI DeskPet</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          上传图片，AI 自动生成专属像素风桌宠，陪你聊天，记住你们的点点滴滴
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" onClick={() => navigate('/create')}>
            ✨ 创建新桌宠
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/pets')}>
            📋 我的桌宠
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="text-2xl">🎨</div>
            <h3 className="font-semibold">AI 生成</h3>
            <p className="text-sm text-muted-foreground">上传图片，AI 自动转换为 16-bit 像素风桌宠，保持原角色特征</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="text-2xl">💬</div>
            <h3 className="font-semibold">智能聊天</h3>
            <p className="text-sm text-muted-foreground">支持 OpenAI 和 DeepSeek，流式输出，桌宠有情绪有记忆</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-2">
            <div className="text-2xl">🧠</div>
            <h3 className="font-semibold">长期记忆</h3>
            <p className="text-sm text-muted-foreground">桌宠会记住你的名字、兴趣和聊天历史，越聊越懂你</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-6 space-y-3">
          <h2 className="text-lg font-semibold">🚀 快速开始</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>前往<strong>设置</strong>配置 AI 供应商（OpenAI / DeepSeek）的 API Key</li>
            <li>点击<strong>创建新桌宠</strong>，上传图片生成像素风桌宠</li>
            <li>桌宠会出现在桌面，点击即可聊天互动</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
