# AI DeskPet 生产部署方案

## 目录

1. [环境要求](#环境要求)
2. [快速开始](#快速开始)
3. [构建安装包](#构建安装包)
4. [自动更新](#自动更新)
5. [错误日志](#错误日志)
6. [发布流程](#发布流程)
7. [版本管理](#版本管理)
8. [代码签名](#代码签名)
9. [中国网络优化](#中国网络优化)
10. [故障排查](#故障排查)

---

## 环境要求

### 开发环境

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 20 LTS | 前端 + Electron |
| Python | >= 3.11 | 后端 API |
| npm | >= 10 | 包管理 |
| Git | >= 2.40 | 版本控制 |

### 生产环境（构建机）

| 工具 | 版本 | 用途 |
|------|------|------|
| Windows SDK | 10.0+ | 原生编译 |
| 代码签名证书 | EV / Standard | 安装包签名 |
| GitHub Actions | - | CI/CD |

---

## 快速开始

### 1. 安装依赖

```bash
# 前端
cd frontend
npm ci

# 后端
cd backend
pip install -e .
```

### 2. 开发运行

```bash
cd frontend
npm run electron:dev
```

### 3. 生产构建

```bash
cd frontend
# 编译 Electron 主进程
npx tsc -p tsconfig.electron.json

# 构建前端
npx vite build

# 打包
npx electron-builder --config electron-builder.yml --win --x64
```

构建产物输出到 `frontend/release/` 目录：

```
release/
  AI-DeskPet-1.0.0-x64.exe                 # NSIS 安装包
  AI-DeskPet-1.0.0-portable-x64.exe        # 便携版
  latest.yml                                # 自动更新元数据
```

---

## 自动更新

### 架构

```
┌─────────────┐    检查更新     ┌──────────────┐
│  Electron   │ ──────────────> │  GitHub / CDN│
│   App       │ <────────────── │  Releases    │
│             │   latest.yml    │              │
│             │                 │  *.exe       │
│             │ ──────────────> │              │
│             │   下载安装包     │              │
└─────────────┘                 └──────────────┘
```

### 配置说明

当前项目使用 **GitHub Releases** 作为更新服务器：

- **electron-builder.yml** 中已配置 `publish.github` 指向 `p47821709-web/ai-deskpet`
- **electron/services/updater.ts** 实现了完整的更新逻辑
- 启动后 10 秒检查更新，之后每 4 小时自动检查
- 发现更新时弹出对话框，支持后台下载 + 安装提示

### GitHub Actions 自动发布

推送 `v*.*.*` 标签时触发：

1. GitHub Actions 在 Windows runner 上构建
2. 生成 NSIS 安装包 + Portable 便携版 + latest.yml
3. 自动上传到 GitHub Releases（draft 草稿状态）
4. 人工审核后发布 Release

### 手动更新部署

如需自建更新服务器：

1. 将 `latest.yml` + `.exe` 部署到 CDN
2. 修改 `electron-builder.yml` 中的 `publish` 配置

---

## 错误日志

### 日志系统

使用 `electron-log` 实现：

| 文件 | 内容 | 轮转 |
|------|------|------|
| `deskpet.log` | 所有日志 (info/warn/error) | 5 MB，保留 7 个 |
| `deskpet-error.log` | 仅 error/warn | 5 MB，保留 7 个 |

### 日志位置

| 环境 | 路径 |
|------|------|
| 生产 (Windows) | `%APPDATA%/AI DeskPet/logs/` |
| 开发 | `./logs/` (项目根目录) |

### 全局异常捕获

- `unhandledRejection` → 自动记录到 error 日志
- `uncaughtException` → 记录并优雅退出（生产环境）
- Renderer 进程错误 → 通过 IPC 发送到主进程记录

### 用户导出日志

设置页面 → 帮助 → 导出日志 (将 `deskpet-error.log` 打包)

---

## 发布流程

### 完整发布步骤

```bash
# 1. 从 develop 创建 release 分支
git checkout develop
git pull
git checkout -b release/1.2.0

# 2. 执行发布脚本
.\scripts\release.ps1 -Version 1.2.0

# 3. 脚本自动执行:
#    - 更新 package.json 版本号
#    - 运行 TypeScript 类型检查
#    - 执行 Vite 生产构建
#    - 运行 electron-builder 打包
#    - 创建 git tag
#    - 推送标签到远程

# 4. 合并到 main
git checkout main
git merge --no-ff release/1.2.0
git tag v1.2.0
git push origin main --tags
```

### 发布渠道

| 渠道 | 标签后缀 | 用途 |
|------|----------|------|
| stable | `v1.0.0` | 正式版 |
| beta | `v1.1.0-beta.1` | 测试版 |
| alpha | `v1.2.0-alpha.1` | 内部测试 |

### CI/CD 自动发布

```bash
# 推送标签即可触发 GitHub Actions
git tag v1.2.0
git push origin v1.2.0
# → 自动构建并上传到 GitHub Releases (draft)
# → 人工审核发布
```

---

## 版本管理

遵循 Semantic Versioning 2.0：

```
主版本.次版本.补丁 (-预发布)
  1.     2.     3   (-beta.1)
```

分支策略：

```
main          生产就绪
develop       日常开发
release/*     发布分支
feature/*     功能分支
fix/*         修复分支
```

---

## 代码签名

### 证书选择

| 类型 | 年费 | 有效期 | 说明 |
|------|------|--------|------|
| EV 证书 | ~$300/年 | 1-3 年 | 企业发布，立即获得信任 |
| Standard | ~$200/年 | 1-3 年 | 个人/小团队，需建立信任 |

### 配置签名

```bash
# 设置环境变量
$env:WIN_CSC_LINK = "C:\cert\my-cert.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-cert-password"

# electron-builder 打包时自动签名
npx electron-builder --config electron-builder.yml --win --x64
```

### GitHub Actions 配置

在仓库 Settings → Secrets and variables → Actions 中配置：

| Secret | 说明 |
|--------|------|
| `WIN_CSC_LINK` | Base64 编码的 .pfx 证书 |
| `WIN_CSC_KEY_PASSWORD` | 证书密码 |

当前未配置代码签名（`CSC_IDENTITY_AUTO_DISCOVERY=false`），安装包在 Windows SmartScreen 中会显示"未知发布者"。

---

## 中国网络优化

### npm 镜像配置

已在 `frontend/.npmrc` 中配置：

```
registry=https://registry.npmmirror.com
```

### Electron 镜像配置

已在 `electron-builder.yml` 中配置：

```yaml
electronDownload:
  mirror: https://npmmirror.com/mirrors/electron/
```

### electron-builder 二进制镜像

构建时需要设置环境变量：

```bash
$env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
```

### GitHub Actions 环境变量

已在 `.github/workflows/release.yml` 中配置：

```yaml
env:
  ELECTRON_MIRROR: https://npmmirror.com/mirrors/electron/
  ELECTRON_BUILDER_BINARIES_MIRROR: https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 常见网络问题

| 问题 | 解决方案 |
|------|----------|
| npm install 卡在 node:electron 安装脚本 | 配置 `ELECTRON_MIRROR` 后重试 |
| electron-builder 下载 winCodeSign 失败 | 配置 `ELECTRON_BUILDER_BINARIES_MIRROR` |
| GitHub Actions 下载缓慢 | GitHub Actions 服务器在海外，第一次构建可能需要 10-20 分钟 |
| electron-builder 7z 解压错误 | 手动下载 winCodeSign 7z 并放入缓存目录 |

---

## 故障排查

### 构建失败

```
问题: npm install 时报错 EBUSY / EPERM
解决:
  1. 关闭所有编辑器/终端中打开的项目文件
  2. 删除 node_modules: Remove-Item -Recurse -Force node_modules
  3. 清除 npm 缓存: npm cache clean --force
  4. 重试
```

```
问题: electron-builder 报错 "exit code 2" (7z 解压)
解决:
  1. 手动下载 winCodeSign 到缓存目录
  2. 删除 7z 中的 darwin/linux 目录
  3. 参考 frontend/build/README.md
```

### 安装包无法启动

```
问题: 安装后应用无法打开 / 缺失 DLL
解决: 安装 Visual C++ Redistributable 2015-2022
```

### 自动更新失败

```
问题: Check for update 返回 404
排查:
  1. 确认 latest.yml 存在且可访问
  2. 确认版本号高于当前版本
  3. 检查 GitHub Release 是否为 "published" 状态
  4. 查看日志: %APPDATA%/AI DeskPet/logs/deskpet.log
```

### 日志取证

```bash
# Windows
type "%APPDATA%\AI DeskPet\logs\deskpet-error.log"

# 设置页面 → 帮助 → 导出日志
```

---

## 生产环境架构图

```
┌─────────────────────────────────────────────────────┐
│                    用户桌面                           │
│  ┌───────────────────────────────────────────────┐  │
│  │          Electron App (Main Process)           │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ PixiJS  │  │   Chat   │  │  Settings    │ │  │
│  │  │ Renderer│  │  Window  │  │  Window      │ │  │
│  │  └─────────┘  └──────────┘  └──────────────┘ │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Auto    │  │ Logger   │  │ Memory Cache │ │  │
│  │  │ Updater │  │          │  │ (IndexedDB)  │ │  │
│  │  └─────────┘  └──────────┘  └──────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
│                         │                           │
│                    HTTP API                          │
│                         │                           │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────┐
│             Backend (FastAPI)                        │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│  │   REST   │  │    AI      │  │   Memory       │  │
│  │   API    │  │   Client   │  │   Service      │  │
│  └──────────┘  └────────────┘  └────────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Image   │  │    File    │  │   SQLite       │  │
│  │  Gen     │  │  Storage   │  │   Database     │  │
│  └──────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         OpenAI API              DeepSeek API
         (GPT-4o / DALL-E)       (deepseek-chat)
```

---

## electron-builder.yml 当前配置

```yaml
appId: com.aideskpet.app
productName: AI DeskPet
target: NSIS + Portable (x64)
publish: GitHub Releases (p47821709-web/ai-deskpet)
icon: resources/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  language: 2052 (简体中文)
  multiLanguageInstaller: true
electronDownload:
  mirror: https://npmmirror.com/mirrors/electron/
```

---

## 发布检查清单

- [ ] CHANGELOG.md 已更新
- [ ] package.json version 已更新
- [ ] 代码已在 release 分支上
- [ ] GitHub Actions 标签已推送
- [ ] Release 从 draft 转为 published
- [ ] 安装包在 Windows 测试机上验证
- [ ] 自动更新功能正常
- [ ] 错误日志能正常生成
