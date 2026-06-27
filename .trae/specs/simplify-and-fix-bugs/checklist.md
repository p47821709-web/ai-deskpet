# Checklist

## 空壳代码删除
- [x] `backend/app/services/chat_service.py` 已删除
- [x] `backend/app/services/pet_service.py` 已删除
- [x] `backend/app/services/generation_service.py` 已删除
- [x] `backend/app/services/embedding_service.py` 已删除
- [x] `backend/app/storage/s3.py` 已删除
- [x] `backend/app/ai/sprite_sheet_gen.py` 已删除
- [x] `backend/app/core/cache.py` 已删除
- [x] `backend/app/ai/model_registry.py` 已删除
- [x] `backend/app/api/v1/chat.py` 已删除
- [x] `backend/app/api/v1/pets.py` 已删除
- [x] `backend/app/api/v1/users.py` 已删除
- [x] `backend/app/api/v1/settings.py` 已删除
- [x] `backend/app/worker/generation_tasks.py` 已删除
- [x] `backend/app/worker/memory_tasks.py` 已删除
- [x] `backend/app/worker/cleanup_tasks.py` 已删除
- [x] `backend/app/worker/celery_app.py` 已删除
- [x] `backend/app/api/v1/router.py` 已更新，移除已删除路由的注册

## 重复代码消除
- [x] 所有 model 文件不再包含本地 `gen_id` 定义，统一使用 `app.utils.id_generator.generate_id`
- [x] `backend/app/utils/date_utils.py` 存在并包含 `date_subdir()` 函数
- [x] `local.py` 和 `generation.py` 使用公共 `date_subdir` 函数
- [x] `memories.py` 中的 `_to_response` 使用 `MemoryResponse.model_validate()` 替代手动构造

## Bug 修复
- [x] `_resolve_image_size` 为不同 pixel_size 返回不同分辨率
- [x] `_create_placeholder_pixel_art` 中 `pixels` 为 None 时有降级处理
- [x] `main.py` 中 `health_check` 为同步函数（非 async）
- [x] `ChatService._parseSSELine` 死代码分支已删除

## 导入清理
- [x] 所有 `__init__.py` 不再导出已删除的模块
- [x] 无因删除模块导致的导入错误

## 验证
- [x] 后端应用可正常启动（`python -m app.main` 或等效验证）
- [x] 前端无 TypeScript 编译错误