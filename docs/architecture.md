# AI DeskPet 架构文档

## 系统分层

### 前端 (Electron + React)
- 主进程：窗口管理、IPC、系统托盘
- 渲染进程：React 组件、PixiJS 渲染、状态管理

### 后端 (FastAPI + Python)
- REST API 层：路由、验证、响应
- 业务逻辑层：服务编排
- AI 集成层：LLM 调用、Prompt 工程
- 数据访问层：SQLAlchemy ORM + SQLite

## 核心数据流
用户上传图片 → AI 生成像素风精灵表 → 桌宠显示在桌面 → 用户与桌宠聊天 → 长期记忆持久化
