# Tauri Deep-Link OAuth 回调不工作

## 症状

- 使用 Supabase Auth 的 OAuth 登录（Google、GitHub 等）
- 浏览器跳转回 `memexflow://auth/callback` 后，应用没有任何反应
- 控制台没有报错，但 deep-link 事件没有触发

## 原因

Tauri 2 的 capabilities 系统需要显式声明 `deep-link:default` 权限。模板项目只包含 `core:default` 和 `opener:default`。

## 解决

在 `src-tauri/capabilities/default.json` 中添加 `deep-link:default`：

```json
{
  "permissions": ["core:default", "opener:default", "deep-link:default"]
}
```

## 同时确保

1. `src-tauri/tauri.conf.json` 中注册了 URL scheme：

```json
{
  "plugins": {
    "deep-link": {
      "schemes": ["memexflow"]
    }
  }
}
```

2. 前端代码中注册了 deep-link 监听器（项目已有 `src/lib/deep-link.ts`）

3. macOS 上需要在 `Info.plist` 中注册 URL scheme（Tauri CLI 自动处理）
