import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function PetList() {
  const navigate = useNavigate()
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的桌宠</h1>
          <p className="text-sm text-muted-foreground mt-1">管理你所有的像素风桌宠</p>
        </div>
        <Button onClick={() => navigate('/create')}>
          ✨ 新建桌宠
        </Button>
      </div>

      <Card className="py-16">
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">🐱</div>
          <div>
            <p className="text-lg font-medium">还没有桌宠</p>
            <p className="text-sm text-muted-foreground">点击下方按钮创建你的第一个 AI 桌宠吧！</p>
          </div>
          <Button onClick={() => navigate('/create')}>创建桌宠</Button>
        </CardContent>
      </Card>
    </div>
  )
}
