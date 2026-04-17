# PowerSync useQuery 离线迁移踩坑

## 症状

1. 应用打开后一直转圈（"Initializing local database..." 或空白页）
2. `SyncStatusIndicator` 始终显示 "Offline" 或 "Connecting..."
3. 页面数据为空（PowerSync 本地 SQLite 还没同步数据）

## 根因分析

### 问题 1: `waitForFirstSync()` 阻塞 UI 渲染

`initPowerSync()` 中调用 `await powerSyncDb.waitForFirstSync()` 会阻塞整个 Promise。如果 PowerSync 连接不上（认证问题、网络慢、云实例配置错误），Provider 永远不 resolve → `setDb()` 永远不执行 → `PowerSyncProvider` 的 `!db && VITE_POWERSYNC_URL` 条件为真 → 显示 "Initializing local database..." 转圈。

**解决**：不要使用 `waitForFirstSync()`。让 `initPowerSync()` 只做 `init()` + `connect()`，数据同步在后台进行，UI 用 fallback 机制处理。

### 问题 2: 条件调用 `useQuery()` 违反 Hooks 规则

```ts
// ❌ 错误：条件调用 hook
const psResult = db ? useQuery(sql, params) : { data: [], isLoading: true };
```

React Hooks 必须在每次渲染时以相同顺序调用。条件调用会导致：

- 组件渲染崩溃
- 状态混乱
- 无限重渲染

**解决**：永远无条件调用 `useQuery()`，即使 PowerSync 不可用也要调（会被 `PowerSyncContext.Provider value={null}` 处理）。

### 问题 3: PowerSync 有连接但本地无数据

`useQuery()` 返回空数组 `[]` 不代表数据不存在——可能只是首次同步还没完成。如果直接用空数据渲染页面，用户看到空白。

**解决**：双路径模式（`useDataQuery`）：

- PowerSync 有数据 → 用 `useQuery()` 响应式数据
- PowerSync 空数据 → fallback 到 Supabase 直连查询
- 当 PowerSync 数据到达后，自动切换到本地数据

## 正确的离线迁移架构

```
页面组件
  ↓
useDataQuery(sql, params, supabaseFetcher, deps)
  ├── 无条件调用 useQuery(sql, params)  ← React Hooks 规则
  ├── PowerSync 有数据? → 用它
  └── PowerSync 空数据? → Supabase fallback
```

写入路径：

```
createProject / createCapture / updateProject / ...
  ↓
getPowerSyncDb() 可用?
  ├── YES → db.execute('INSERT ...')  ← 离线写入，自动排队
  └── NO  → supabase.from().insert()  ← 直接 Supabase
```

## SyncStatusIndicator 三级状态

```
!connected && !hasSynced  → Connecting... (黄色，初始化中)
!connected && hasSynced   → Offline (灰色，曾连上但现在断开)
connected && uploading/downloading → Syncing... (蓝色脉动)
connected && !uploading && !downloading → Synced (绿色)
```

## 关键代码参考

### PowerSyncProvider — 不阻塞 UI

```tsx
// ✅ 正确：init + connect，不等待首次同步
export function PowerSyncProvider({ children }) {
  const [db, setDb] = useState(null);
  useEffect(() => {
    initPowerSync()
      .then(() => setDb(getPowerSyncDb()))
      .catch(setError);
  }, []);
  // ...
}
```

### useDataQuery — 双路径

```tsx
function useDataQuery(sql, params, supabaseFetcher, deps) {
  // ✅ 无条件调用 useQuery（Hooks 规则）
  const psResult = useQuery(sql, params);

  // PowerSync 有数据 → 用它；否则 → Supabase fallback
  const hasPsData = psResult.data && psResult.data.length > 0;

  useEffect(() => {
    if (!hasPsData) {
      supabaseFetcher().then(setFallbackData);
    }
  }, [hasPsData, ...deps]);

  return {
    data: hasPsData ? psResult.data : fallbackData,
    isLoading: hasPsData ? psResult.isLoading : fallbackLoading,
  };
}
```

## 相关文档

- [powersync-worker-404.md](./powersync-worker-404.md) — Worker 404 与 useWebWorker:false
- [powersync-provider-context.md](./powersync-provider-context.md) — PowerSyncContext 类型
