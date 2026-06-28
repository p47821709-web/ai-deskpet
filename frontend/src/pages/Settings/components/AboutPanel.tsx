import React from 'react'

export default function AboutPanel() {
  return (
    <div className="space-y-6">
      {/* 应用信息 */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
          🐾
        </div>
        <div>
          <h3 className="text-lg font-bold">AI 桌宠</h3>
          <p className="text-xs text-muted-foreground mt-0.5">v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">
            你的智能桌面伙伴
          </p>
        </div>
      </div>

      {/* 技术栈 */}
      <section>
        <h3 className="text-sm font-semibold mb-3">技术栈</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['前端', 'React + TypeScript + Electron'],
            ['动画', 'PixiJS 7'],
            ['后端', 'Python FastAPI'],
            ['数据库', 'SQLite'],
            ['AI', 'OpenAI / DeepSeek / 豆包'],
            ['样式', 'TailwindCSS + ShadcnUI'],
          ].map(([label, value], i) => (
            <div key={i} className="rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <p className="text-sm font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section>
        <h3 className="text-sm font-semibold mb-3">功能特性</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'AI 生成像素风桌宠',
            '桌面叠加层显示',
            '智能聊天助手',
            '长期记忆系统',
            '情绪互动反馈',
            '支持 OpenAI、DeepSeek、豆包',
          ].map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-primary">✦</span>
              {f}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}