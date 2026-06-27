## 新增生产依赖

部署方案引入了两个新依赖，需要手动安装：

```bash
cd frontend
npm install electron-log@^5.1.1 electron-updater@^6.2.0
```

这会修改 `package.json` 的 `dependencies` 部分，新增：

```json
{
  "dependencies": {
    "electron-log": "^5.1.1",
    "electron-updater": "^6.2.0"
  }
}
```
