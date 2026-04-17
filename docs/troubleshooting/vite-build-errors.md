# Vite 构建错误

## 问题 1: PowerSync Web Worker IIFE 格式不兼容

### 症状

```
[commonjs--resolver] Invalid value "iife" for option "worker.format" - UMD and IIFE output formats are not supported for code-splitting builds.
```

指向 `@powersync/web` 的 `SharedWebStreamingSyncImplementation.js`。

### 原因

`@powersync/web` 内部使用 Web Worker，默认输出格式为 `iife`。Vite 7 / Rollup 不再支持 code-splitting 构建中的 IIFE 格式。

### 解决

`vite.config.ts` 中显式指定 worker 格式为 ES module：

```ts
export default defineConfig({
  worker: {
    format: "es",
  },
});
```

---

## 问题 2: WASQLiteDB.worker.js 404 + Vite dep optimizer 冲突

### 症状

```
Failed to load resource: 404 (Not Found)  WASQLiteDB.worker.js
The file does not exist at "node_modules/.vite/deps/WASQLiteDB.worker.js?worker_file&type=ignore"
The dependency might be incompatible with the dep optimizer. Try adding it to `optimizeDeps.exclude`.
```

### 原因

PowerSync Web SDK 在浏览器中通过 `new Worker(new URL('./WASQLiteDB.worker.js', import.meta.url))` 加载 SQLite Worker。在小程序包中，Vite 的依赖预构建（dep optimizer）无法正确处理这个 worker 文件。

### 解决（Tauri 专用）

Tauri 桌面应用只有一个 WebView，不需要 Web Worker 多标签支持。直接禁用 Worker 模式：

```ts
const db = new PowerSyncDatabase({
  database: { dbFilename: "memexflow.db" },
  schema: AppSchema,
  flags: {
    enableMultiTabs: false,
    useWebWorker: false,
  },
});
```

同时在 `vite.config.ts` 中排除 PowerSync 包的预构建：

```ts
optimizeDeps: {
  exclude: ["@powersync/web", "@powersync/common"],
},
```

清除缓存后重启：`rm -rf node_modules/.vite`

### 适用场景

- Tauri 桌面应用（单窗口，不需要 SharedWorker）
- 不需要多标签页同时访问同一 SQLite 数据库的场景

### 不适用场景

- 纯 Web 应用需要多标签页支持 → 必须解决 Worker 加载问题
- 参考 [powersync-worker-404.md](./powersync-worker-404.md) 了解替代方案
