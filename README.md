# AI DeskPet - 企业级 AI 桌宠生成器

## 项目简介
AI DeskPet 是一款桌面桌宠应用，用户可以上传图片，AI 自动生成像素风桌宠，显示在桌面上，支持聊天和长期记忆。

## 快速开始

### 后端
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 打包
```bash
cd frontend
npm run build
npm run electron:build
```
