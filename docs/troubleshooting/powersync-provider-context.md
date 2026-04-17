# PowerSyncProvider Context 类型不匹配

## 症状

TypeScript 报错：`PowerSyncContext.Provider` 的 `value` 类型为 `AbstractPowerSyncDatabase`，而我们传入的 `db` 可能为 `null`。

## 原因

`@powersync/react` 的 `PowerSyncContext` 期望 `AbstractPowerSyncDatabase | null`（类型已内置），但我们之前的实现用了自定义的 `initialized` boolean 状态来控制渲染，导致 Provider 的 value 可能为 `null`（PowerSync 未配置时）或 `PowerSyncDatabase` 实例。

## 解决

使用正确的状态类型 `AbstractPowerSyncDatabase | null`：

```tsx
const [db, setDb] = useState<AbstractPowerSyncDatabase | null>(null);

useEffect(() => {
  initPowerSync()
    .then(() => setDb(getPowerSyncDb()))
    .catch(setError);
}, []);

return (
  <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
);
```

**关键点**：

- `PowerSyncDatabase` 是 `AbstractPowerSyncDatabase` 的子类，可以直接传给 Context
- `null` 值是合法的——组件中使用 `useQuery` 等 hooks 时需要处理 null 情况
- 不需要用 `initialized` boolean 来控制，因为 `null` 本身就表示"还没准备好"
