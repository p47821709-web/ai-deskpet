# 简化代码 & 修复 Bug 规范

## Why

项目代码存在大量空壳服务/端点、重复代码逻辑、未使用的模块以及若干潜在 bug，导致代码库臃肿、维护困难。

## What Changes

### Bug 修复
- 修复 `PixelConverter._create_placeholder_pixel_art` 中 `pixels.load()` 返回 None 时的空指针风险
- 修复 `MemoryService.search_memories()` 全量加载所有记忆到内存再评分的性能问题
- 修复 `_resolve_image_size` 所有尺寸映射到同一分辨率 `1024x1024` 的逻辑问题
- 修复 `main.py` 中 `health_check` 无意义地声明为 `async` 的问题

### 代码简化
- 删除空壳桩代码：`chat_service.py`、`pet_service.py`、`generation_service.py`、`embedding_service.py` 及其对应的路由端点
- 删除空壳桩代码：`worker/` 下所有 `pass` 体的任务文件、`s3.py`、`sprite_sheet_gen.py`
- 删除未使用的模块：`cache.py`（MemoryCache）、`model_registry.py`（ModelRegistry）
- 消除重复的 `gen_id` 函数，统一使用 `utils/id_generator.py`
- 消除重复的 `_date_subdir` 逻辑，统一使用公共工具函数
- 简化 `_to_response` 转换函数，使用 Pydantic `from_attributes` 配置
- 删除 `ChatService._parseSSELine` 中的死代码分支
- 移除未使用的导入

## Impact

- Affected specs: 无
- Affected code: `backend/app/services/`, `backend/app/api/v1/`, `backend/app/ai/`, `backend/app/models/`, `backend/app/core/`, `backend/app/worker/`, `backend/app/storage/`, `backend/app/main.py`, `frontend/src/services/ChatService.ts`

## REMOVED Requirements

### Requirement: 空壳桩代码服务
**Reason**: chat_service、pet_service、generation_service、embedding_service 均为返回空数据的空壳，worker 任务均为 `pass` 体，S3Storage、SpriteSheetGenerator 为未实现的桩。
**Migration**: 删除这些文件，对应的路由端点也一并删除（保留已有实际逻辑的 generation 路由）。

## MODIFIED Requirements

### Requirement: 统一 ID 生成
多个 model 文件中重复定义 `gen_id` 函数，应统一使用 `app/utils/id_generator.py` 中的 `generate_id`。

### Requirement: 统一日期子目录生成
`LocalStorage._date_subdir` 和 `generation.py` 中的 `_get_date_prefix` 存在重复逻辑，应提取为公共工具函数。

### Requirement: Memory 响应转换
`memories.py` 路由中的 `_to_response` 手动构造 `MemoryResponse`，应利用 Pydantic `from_attributes = True` 配置简化。

### Requirement: ChatService SSE 解析
`_parseSSELine` 中存在永远返回 `null` 的死代码分支（lines 296-302），应删除。

## ADDED Requirements

### Requirement: 搜索性能优化
`MemoryService.search_memories()` 不应全量加载所有记忆到内存。应使用数据库层面的查询过滤，只加载需要评分的记忆。

#### Scenario: 大量记忆搜索
- **WHEN** 宠物有超过 1000 条记忆且用户执行搜索
- **THEN** 系统不应将全部记忆加载到内存，而应在数据库层面进行初步过滤

### Requirement: 占位像素图生成健壮性
`_create_placeholder_pixel_art` 中 `pixels.load()` 在某些图片模式下可能返回 None，应添加空值检查。

#### Scenario: 占位图生成失败
- **WHEN** `Image.new('RGBA', ...)` 的 `load()` 返回 None
- **THEN** 系统应返回最基本的纯色 PNG 而非崩溃

### Requirement: health_check 端点同步声明
`main.py` 中的 `health_check` 端点无异步操作，不应声明为 `async def`。

#### Scenario: 健康检查
- **WHEN** 请求 `/api/v1/system/health`
- **THEN** 返回 `{"status": "ok", "version": "1.0.0"}`