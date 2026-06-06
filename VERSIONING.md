# 版本管理

## 版本号规范

遵循 Semantic Versioning 2.0：

```
主版本.次版本.补丁 (-预发布)
  1.     2.     3   (-beta.1)
```

| 类型 | 示例 | 说明 |
|------|------|------|
| 主版本 | 2.0.0 | 不兼容的 API 改动 |
| 次版本 | 1.3.0 | 向下兼容的新功能 |
| 补丁 | 1.2.1 | 向下兼容的缺陷修复 |
| 预发布 | 1.2.3-beta.1 | 测试版本 |

## 分支策略

```
main          --- 生产就绪，只允许合并 release 分支
  |
release/*    --- 从 develop 创建，release/1.2.0 -> main
  |
develop       --- 日常开发主分支
  |
feature/*     --- 新功能分支，feature/user-avatar -> develop
fix/*         --- 缺陷修复分支，fix/login-crash -> develop
```

## 发布流程

1. 从 develop 创建 release 分支
2. 在 release 分支上仅做 bug 修复
3. 运行完整测试套件
4. 更新 CHANGELOG.md
5. 合并到 main 并打标签
6. CI/CD 自动构建发布

## 构建产物

| 文件 | 说明 |
|------|------|
| `AI-DeskPet-{version}-x64.exe` | NSIS 安装包 (推荐) |
| `AI-DeskPet-{version}-portable-x64.exe` | 便携版 (免安装) |
| `latest.yml` | 自动更新元数据 |

## 自动更新

当前使用 electron-updater + GitHub Releases：

1. 推送标签 `v*.*.*` 触发 CI/CD
2. GitHub Actions 构建安装包
3. 自动上传到 GitHub Releases
4. 用户端启动后 10 秒检查更新
5. 每 4 小时自动检查一次
6. 发现新版本弹出更新对话框
