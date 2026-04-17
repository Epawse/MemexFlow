# PowerSync PSYNC_S2105: Unexpected "aud" claim value

## 症状

`SyncStatus.downloadError` 报错：

```
[PSYNC_S2105] Unexpected "aud" claim value: "authenticated"
```

`SyncStatus.connected` 始终为 `false`，`SyncStatusIndicator` 显示 "Connecting..."。

## 原因

Supabase JWT 的 `aud`（audience）claim 值为 `"authenticated"`，但 PowerSync Cloud 实例的认证配置没有包含这个 audience。

PowerSync 默认验证 JWT 的 `aud` claim，如果配置的 audience 列表不包含 `"authenticated"`，就会拒绝连接。

## 解决

### 方案 A：开启 Supabase Auth（推荐）

在 PowerSync Dashboard 中：

1. 进入实例 → **Authentication** 设置
2. 开启 **"Use Supabase Auth"** 复选框
3. 填入 Supabase 项目 URL：`https://vwloyomsrbrefuwfmnln.supabase.co`
4. PowerSync 会自动配置 JWKS 和 audience

### 方案 B：手动配置 JWKS

如果自动检测不工作：

1. 进入实例 → **Authentication** 设置
2. 取消 "Use Supabase Auth"
3. JWKS URI: `https://vwloyomsrbrefuwfmnln.supabase.co/auth/v1/.well-known/jwks.json`
4. Audience: 添加 `"authenticated"`
5. 保存并等待实例重启

### 验证

在浏览器 Console 中查看 `[PowerSync] Status:` 日志：

- `downloadError: null` + `connected: true` → 修复成功
- `downloadError: "..."` + `connected: false` → 认证仍有问题

## 参考

- [PowerSync Auth Error Codes](https://docs.powersync.com/debugging/error-codes)
- [PowerSync Supabase Auth Config](https://docs.powersync.com/configuration/auth/supabase-auth)
