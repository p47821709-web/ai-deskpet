# 版本管理

## 版本号规范

遵循 Semantic Versioning 2.0：

\\\
主版本.次版本.补丁 (-预发布)
  1.     2.     3   (-beta.1)
\\\

| 类型 | 示例 | 说明 |
|------|------|------|
| 主版本 | 2.0.0 | 不兼容的 API 改动 |
| 次版本 | 1.3.0 | 向下兼容的新功能 |
| 补丁 | 1.2.1 | 向下兼容的缺陷修复 |
| 预发布 | 1.2.3-beta.1 | 测试版本 |

## 分支策略

\\\
main          --- 生产就绪，只允许合并 release 分支
  |
release/*    --- 从 develop 创建，release/1.2.0 -> main
  |
develop       --- 日常开发主分支
  |
feature/*     --- 新功能分支，feature/user-avatar -> develop
fix/*         --- 缺陷修复分支，fix/login-crash -> develop
\\\

## 发布流程

1. 从 develop 创建 release 分支
2. 在 release 分支上仅做 bug 修复
3. 运行完整测试套件
4. 更新 CHANGELOG.md
5. 合并到 main 并打标签
6. CI/CD 自动构建发布

