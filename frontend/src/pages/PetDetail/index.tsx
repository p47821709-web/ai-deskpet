import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams } from 'react-router-dom'

export default function PetDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/pets')}>← 返回</Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">桌宠详情</h1>
          <p className="text-sm text-muted-foreground mt-1">桌宠编号: {id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              像素风桌宠预览
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">名称</span>
              <span className="text-sm font-medium">小咪</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">创建时间</span>
              <span className="text-sm font-medium">2026-06-06</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">互动次数</span>
              <span className="text-sm font-medium">0 次</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">记忆条数</span>
              <span className="text-sm font-medium">0 条</span>
            </div>
            <div className="pt-4 flex gap-3">
              <Button className="flex-1" onClick={() => navigate('/chat/' + id)}>💬 开始聊天</Button>
              <Button variant="outline" className="flex-1">🗑️ 删除桌宠</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
