# Tasks

## 第一阶段：删除空壳桩代码（可并行）

- [x] Task 1: 删除后端空壳服务文件
  - 删除 `backend/app/services/chat_service.py`
  - 删除 `backend/app/services/pet_service.py`
  - 删除 `backend/app/services/generation_service.py`
  - 删除 `backend/app/services/embedding_service.py`
  - 删除 `backend/app/storage/s3.py`
  - 删除 `backend/app/ai/sprite_sheet_gen.py`
  - 删除 `backend/app/core/cache.py`
  - 删除 `backend/app/ai/model_registry.py`

- [x] Task 2: 删除空壳路由端点文件
  - 删除 `backend/app/api/v1/chat.py`
  - 删除 `backend/app/api/v1/pets.py`
  - 删除 `backend/app/api/v1/users.py`
  - 删除 `backend/app/api/v1/settings.py`
  - 更新 `backend/app/api/v1/router.py` 移除已删除路由的注册

- [x] Task 3: 删除空壳 worker 任务文件
  - 删除 `backend/app/worker/generation_tasks.py`
  - 删除 `backend/app/worker/memory_tasks.py`
  - 删除 `backend/app/worker/cleanup_tasks.py`
  - 删除 `backend/app/worker/celery_app.py`

- [x] Task 4: 清理 `__init__.py` 中已删除模块的导出
  - 更新 `backend/app/services/__init__.py`
  - 更新 `backend/app/ai/__init__.py`
  - 更新 `backend/app/worker/__init__.py`
  - 更新 `backend/app/storage/__init__.py`
  - 更新 `backend/app/core/__init__.py`
  - 所有 __init__.py 均为空文件，无需额外清理

## 第二阶段：消除重复代码

- [x] Task 5: 统一 `gen_id` 函数
  - 修改 `backend/app/models/memory.py`：删除本地 `gen_id`，导入 `app.utils.id_generator.generate_id`
  - 修改 `backend/app/models/pet.py`：删除本地 `gen_id`，导入 `app.utils.id_generator.generate_id`
  - 修改 `backend/app/models/chat.py`：删除本地 `gen_id`，导入 `app.utils.id_generator.generate_id`
  - 修改 `backend/app/models/user.py`：删除本地 `gen_id`，导入 `app.utils.id_generator.generate_id`

- [x] Task 6: 提取公共 `_date_subdir` 函数
  - 在 `backend/app/utils/` 创建 `date_utils.py`，包含 `date_subdir()` 函数
  - 修改 `backend/app/storage/local.py`：使用公共函数替换 `_date_subdir`
  - 修改 `backend/app/api/v1/generation.py`：使用公共函数替换 `_get_date_prefix`

- [x] Task 7: 简化 `_to_response` 使用 Pydantic `from_attributes`
  - 修改 `backend/app/api/v1/memories.py`：用 `MemoryResponse.model_validate(memory)` 替换手动构造的 `_to_response`
  - 同步修改 `backend/app/services/memory_service.py` 中 `search_memories` 的 `MemoryResponse` 构造
  - 为 `MemoryResponse` 添加 `@field_validator` 确保 datetime -> str 的 ISO 格式转换

## 第三阶段：Bug 修复

- [x] Task 8: 修复 `_resolve_image_size` 映射逻辑
  - 修改 `backend/app/ai/pixel_converter.py`：为不同 pixel_size 提供不同的输出分辨率（16→512x512, 24→768x768, 32→1024x1024, 48→1024x1024, 64→1792x1024）

- [x] Task 9: 修复 `_create_placeholder_pixel_art` 空指针风险
  - 修改 `backend/app/ai/pixel_converter.py`：添加 `pixels` 为 None 时的降级处理（返回纯色图）

- [x] Task 10: 修复 `health_check` 无意义的 async 声明
  - 修改 `backend/app/main.py`：将 `async def health_check()` 改为 `def health_check()`

- [x] Task 11: 删除前端 `ChatService._parseSSELine` 死代码
  - 修改 `frontend/src/services/ChatService.ts`：删除 lines 296-302 的死代码分支

## 第四阶段：清理导入

- [x] Task 12: 清理未使用的导入
  - `cache.py` 已删除（包含未使用的 `lru_cache` 导入）
  - `middleware.py` 经检查无未使用导入
  - 清理 `generation.py` 中不再需要的 `datetime` 导入

# Task Dependencies

- Task 2、Task 3、Task 4 依赖 Task 1（先删除服务文件，再删路由和 worker）
- Task 5、Task 6、Task 7 独立，可并行
- Task 8、Task 9、Task 10、Task 11 独立，可并行
- Task 12 在 Task 1-4 完成后执行