import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams } from 'react-router-dom'
import { usePetStore } from '@/stores/usePetStore'

export default function PetDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const pet = usePetStore((s) => s.getPet(id || ''))
  const removePet = usePetStore((s) => s.removePet)

  if (!pet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/pets')}>← 返回</Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">桌宠未找到</h1>
            <p className="text-sm text-muted-foreground mt-1">该桌宠可能已被删除</p>
          </div>
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    if (window.confirm(`确定要删除「${pet.name}」吗？此操作不可撤销。`)) {
      removePet(pet.id)
      navigate('/pets')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/pets')}>← 返回</Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pet.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            创建于 {pet.createdAt}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 预览 */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {pet.imageUrl ? (
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="text-4xl">🐾</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 详情 */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">名称</span>
              <span className="text-sm font-medium">{pet.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">风格</span>
              <span className="text-sm font-medium">{pet.style}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">像素尺寸</span>
              <span className="text-sm font-medium">{pet.pixelSize}px</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">创建时间</span>
              <span className="text-sm font-medium">{pet.createdAt}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">互动次数</span>
              <span className="text-sm font-medium">{pet.interactions} 次</span>
            </div>
            <div className="pt-4 flex gap-3">
              <Button className="flex-1" onClick={() => navigate(`/chat/${pet.id}`)}>
                💬 开始聊天
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>
                🗑️ 删除桌宠
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}