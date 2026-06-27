# Changelog

All notable changes to AI DeskPet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-06

### Added

- **图片上传** — 支持 PNG/JPG/JPEG/WebP 格式，拖拽上传 + 预览
- **AI 像素风转换** — 调用 OpenAI DeepSeek 兼容 API 生成透明背景像素桌宠
- **桌宠渲染系统** — 基于 PixiJS，支持站立/行走/睡觉/拖动/点击互动
- **聊天系统** — 与桌宠对话，支持 OpenAI DeepSeek，Streaming 输出
- **长期记忆系统** — SQLite 存储用户昵称/兴趣/聊天历史/偏好，支持 CRUD 搜索
- **桌宠主动互动** — 随机 30–120 分钟触发主动问候，支持开心/无聊/困倦状态
- **设置中心** — API 地址/Key/模型配置、桌宠名称/音量/大小、开机自启、记忆开关
- **国际化** — 全界面简体中文，符合中国用户习惯

### Changed

- 全面重构项目架构为模块化设计
- 优化 PixiJS 渲染性能

### Fixed

- 修复 Electron 主进程 ESM 模块加载问题
- 修复 Windows 路径包含中文时的编码问题
- 修复 release.ps1 PowerShell 语法错误
- 修复异步操作中的内存泄漏

### Security

- OpenAI DeepSeek API Key 本地加密存储
- 用户数据仅存储在本地 SQLite，不上传云端

## [Unreleased]

### Planned

- 多桌宠同时显示
- 桌宠商店 / 皮肤系统
- macOS Linux 平台支持
- 桌宠小游戏（点击得分、养成）
