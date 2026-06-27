# API 参考文档

## 基础信息

- **Base URL**: `http://localhost:8000/api/v1`
- **认证方式**: `X-Device-Id` Header
- **响应格式**: `{ code, message, data, meta }`

## 核心接口

| 模块 | 端点 | 方法 | 说明 |
|------|------|------|------|
| 桌宠 | /pets | GET/POST | 桌宠 CRUD |
| 聊天 | /chat/sessions | GET/POST | 聊天会话 |
| 记忆 | /memories | GET/POST | 长期记忆 |
| 生成 | /generations | POST | AI 生成 |
| 用户 | /users | GET/PATCH | 用户管理 |
| 设置 | /settings | GET/PUT | 应用设置 |
