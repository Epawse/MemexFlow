# PowerSync WASQLiteDB.worker.js 404 与初始化卡住

## 症状

1. 浏览器控制台报错：`Failed to load resource: 404 (Not Found) WASQLiteDB.worker.js`
2. Vite 依赖优化器报错：`The file does not exist at "node_modules/.vite/deps/WASQLiteDB.worker.js?worker_file&type=ignore"`
3. PowerSync 初始化永远卡在 "Initializing local database..." 转圈

## 根因分析

PowerSync Web SDK 通过 `new Worker(new URL('./WASQLiteDB.worker.js', import.meta.url))` 动态创建 Worker 线程来运行 SQLite。这套机制是为浏览器环境设计的，在 Vite 打包/开发中存在多个问题：

1. **Vite pre-bundle 不支持 Worker 文件**：Vite 的 dep optimizer 会尝试预构建 `@powersync/web`，但内部的 `.worker.js` 文件不符合 ES module 规范，导致 404
2. **Worker 加载路径问题**：即使把 Worker 文件放到 `public/` 目录并设置 `sync.worker` URL，在开发模式下仍然可能被 Vite 拦截或代理

## 解决方案

### 方案 A：禁用 Web Worker（推荐用于 Tauri）

Tauri 桌面应用只有一个 WebView 窗口，不需要 Worker 线程：

```ts
const db = new PowerSyncDatabase({
  database: { dbFilename: "memexflow.db" },
  schema: AppSchema,
  flags: {
    enableMultiTabs: false, // 不需要多标签页
    useWebWorker: false, // 在主线程运行 SQLite
  },
});
```

配合 `vite.config.ts`：

```ts
optimizeDeps: {
  exclude: ["@powersync/web", "@powersync/common"],
},
```

### 方案 B：保留 Worker（纯 Web 应用）

如果需要多标签页支持：

1. 将 `WASQLiteDB.umd.js` 从 `node_modules/@powersync/web/dist/worker/` 复制到 `public/`
2. 在 `PowerSyncDatabase` 构造时指定 worker URL：

```ts
const db = new PowerSyncDatabase({
  database: { dbFilename: "memexflow.db" },
  schema: AppSchema,
  sync: {
    worker: "/WASQLiteDB.worker.js",
  },
});
```

3. Vite 配置中需要 `worker: { format: "es" }`

### 方案 C：使用 PowerSync Tauri 插件（未来）

`@powersync/tauri-plugin` 目前是 alpha 版（0.0.3），使用原生 SQLite 而不是 wa-sqlite，从根本上避免 Worker 问题。等稳定后迁移。

## 注意事项

- 禁用 Worker 后，大量数据操作可能阻塞主线程，但 Tauri 桌面应用的数据量通常不大
- 每次升级 `@powersync/web` 后，如果使用方案 B，需要重新复制 Worker 文件
