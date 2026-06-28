import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/create', label: '创建桌宠', icon: '✨' },
  { path: '/pets', label: '我的桌宠', icon: '🐾' },
  { path: '/chat', label: '聊天', icon: '💬' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边导航栏 */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-5 py-5 border-b border-border cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="text-2xl">🐾</span>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AI 桌宠</h1>
            <p className="text-[10px] text-muted-foreground">你的智能桌面伙伴</p>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* 底部信息 */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">AI DeskPet v1.0.0</p>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}