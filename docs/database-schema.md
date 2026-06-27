# 数据库设计文档

## 表结构总览

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| users | 用户/设备 | id, device_id, nickname |
| pets | 桌宠 | id, user_id, name, species, sprite_sheet_url |
| chat_sessions | 聊天会话 | id, pet_id, title, message_count |
| chat_messages | 聊天消息 | id, session_id, role, content |
| memories | 长期记忆 | id, pet_id, content, importance, embedding_id |
| memory_embeddings | 记忆向量 | id, memory_id, vector, dimension |
| generation_jobs | 生成任务 | id, user_id, source_image_url, status |
| pet_animations | 动画定义 | id, pet_id, animation_type, sprite_url |
| interaction_logs | 交互日志 | id, pet_id, interaction_type |
| ai_model_configs | AI 模型配置 | id, user_id, provider, model_name |
| app_settings | 应用设置 | id, user_id, category, settings |
