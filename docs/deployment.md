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
npm run build
npx electron-builder --config electron-builder.yml --win --x64
```

构建产物输出到 `frontend/release/` 目录：

```
release/
  AI-DeskPet-1.0.0-x64.exe       # NSIS 安装包
  AI-DeskPet-1.0.0-portable-x64.exe  # 便携版
  latest.yml                      # 自动更新元数据
```

---

## 自动更新

### 架构

```
┌─────────────┐    检查更新     ┌──────────────┐
│  Electron   │ ──────────────> │  GitHub/CDN  │
│   App       │ <────────────── │  Releases    │
│             │   latest.yml    │              │
│             │                 │  *.exe       │
│             │ ──────────────> │              │
│             │   下载安装包     │              │
└─────────────┘                 └──────────────┘
```

### 配置步骤

1. **服务端配置**（二选一）

   **方案 A: GitHub Releases（推荐）**
   - 推送标签时自动创建 Release
   - `electron-updater` 通过 GitHub API 检查更新
   - 无需额外服务器

   **方案 B: 自建更新服务器**
   - 将 `latest.yml` + `.exe` 部署到 CDN
   - 配置 `electron-builder.yml` 中的 `publish.url`
   - 示例 Nginx 配置：

   ```nginx
   server {
       listen 443 ssl;
       server_name releases.aideskpet.com;

       root /var/www/releases;
       autoindex off;

       location ~ \.exe$ {
           add_header Cache-Control "public, max-age=3600";
       }

       location /latest.yml {
           add_header Cache-Control "no-cache";
       }
   }
   ```

2. **客户端配置**

   更新服务已在 `electron/services/updater.ts` 中实现：
   - 启动后 10 秒自动检查
   - 每隔 4 小时自动检查
   - 发现更新时弹出对话框
   - 后台下载 + 安装提示

### 更新验证流程

```
发现新版本 v1.2.0
  │
  ├─ 用户选择"立即更新"
  │     │
  │     ├─ 后台下载进度提示
  │     │
  │     ├─ 下载完成
  │     │     │
  │     │     ├─ 询问"立即重启？"
  │     │     │   ├─ 是 → quitAndInstall()
  │     │     │   └─ 否 → 下次启动时安装
  │     │
  │     └─ 下载失败 → 提示重试
  │
  └─ 用户选择"稍后再说"
        └─ 下次检查时再次提示
```

---

## 错误日志

### 日志系统架构

```
App 运行
  │
  ├─ Main Process
  │     ├─ electron-log (文件)
  │     │     ├─ deskpet.log          (所有日志)
  │     │     └─ deskpet-error.log    (仅 error/warn)
  │     │
  │     └─ console (开发环境)
  │
  └─ Renderer Process
        ├─ console.log → 通过 IPC 发送到主进程
        └─ window.onerror → 自动捕获未处理异常
```

### 日志位置

| 平台 | 路径 |
|------|------|
| Windows | `%APPDATA%/AI DeskPet/logs/` |
| 开发环境 | `./logs/` |

### 日志文件管理

- **文件大小**: 5 MB 轮转
- **保留数量**: 最近 7 个文件
- **日志级别**:
  - 生产: `info` (error/warn/info)
  - 开发: `debug` (全部)

### 用户上报

1. 在设置页面添加"导出日志"按钮
2. 将 `deskpet-error.log` 打包
3. 上传到技术支持

---

## 发布流程

### 完整发布步骤

```bash
# 1. 确保 develop 分支代码就绪
git checkout develop
git pull

# 2. 创建 release 分支
git checkout -b release/1.2.0

# 3. 执行发布脚本
.\scripts\release.ps1 -Version 1.2.0

# 4. 脚本自动执行:
#    - 更新 package.json 版本号
#    - 运行 TypeScript 类型检查
#    - 执行 Vite 生产构建
#    - 运行 electron-builder 打包
#    - 创建 git tag
#    - 推送至 GitHub

# 5. GitHub Actions 自动:
#    - 构建 Windows 安装包
#    - 生成 latest.yml 更新元数据
#    - 创建 GitHub Release (draft)

# 6. 手动:
#    - 测试安装包
#    - 补充 Release Notes
#    - 发布 Release
```

### 发布清单

每次发布前检查:

- [ ] 所有测试通过
- [ ] CHANGELOG.md 已更新
- [ ] 版本号已正确更新
- [ ] 代码签名证书有效
- [ ] 构建产物体积合理
- [ ] 安装包在新系统上测试通过
- [ ] 自动更新功能测试通过
- [ ] 后端 API 兼容性确认

---

## 版本管理

### 版本号规则

```
X.Y.Z[-PRERELEASE]
```

| 部分 | 说明 | 示例 |
|------|------|------|
| X | 主版本 — 不兼容 API 变更 | `2.0.0` |
| Y | 次版本 — 向下兼容新功能 | `1.3.0` |
| Z | 补丁 — 向下兼容 bug 修复 | `1.2.1` |
| PRERELEASE | 预发布标识 | `1.2.3-beta.1` |

### 分支模型

```
main ────────────── 仅接受 release 合并
  │
release/1.2.0 ───── 从 develop 拉出，只修 bug
  │
develop ──────────── 日常开发
  │
feature/* ────────── 新功能
fix/* ────────────── 缺陷修复
```

### 标签命名

```
v1.2.0        # 正式版
v1.2.3-beta.1  # 预发布版
```

---

## 代码签名

Windows 安装包签名是**强烈推荐**的步骤，可避免 SmartScreen 拦截。

### 获取证书

| 类型 | 价格 | 有效期 | 适用场景 |
|------|------|--------|----------|
| EV 证书 | ~$300/年 | 1-3 年 | 企业发布，立即获得信任 |
| Standard | ~$200/年 | 1-3 年 | 个人/小团队，需建立信任 |

推荐提供商: DigiCert, Sectigo, Let\'s Encrypt (不支持代码签名)

### 配置签名

```bash
# 1. 将 .pfx 证书文件放到安全位置

# 2. 设置环境变量
$env:WIN_CSC_LINK = "C:\cert\my-cert.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-cert-password"

# 3. electron-builder 自动签名
npx electron-builder --config electron-builder.yml --win --x64
```

### GitHub Actions 中使用

在仓库 Settings → Secrets and variables → Actions 中配置:

| Secret | 说明 |
|--------|------|
| `WIN_CSC_LINK` | Base64 编码的 .pfx 证书 |
| `WIN_CSC_KEY_PASSWORD` | 证书密码 |

Base64 编码证书:

```bash
certutil -encode my-cert.pfx cert-base64.txt
# 将 cert-base64.txt 内容复制到 GitHub Secret
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

## 故障排查

### 安装失败

```
问题: 安装包无法启动 / 缺失 DLL
解决: 安装 Visual C++ Redistributable 2015-2022
```

### 自动更新失败

```
问题: Check for update 返回 404
排查:
  1. 确认 latest.yml 存在且可访问
  2. 确认版本号高于当前版本
  3. 检查 GitHub Release 是否为 "published" 状态
  4. Electron 日志: %APPDATA%/AI DeskPet/logs/deskpet.log
```

### 日志取证

```bash
# Windows
type "%APPDATA%\AI DeskPet\logs\deskpet-error.log"

# 导出日志供技术支持
# 设置页面 → 帮助 → 导出日志
```
