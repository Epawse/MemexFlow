# Troubleshooting Index

> MemexFlow 开发过程中踩过的坑和解决方案，按模块分类。

## 环境与构建

| 文件                                                   | 问题                                 | 关键词                                  |
| ------------------------------------------------------ | ------------------------------------ | --------------------------------------- |
| [vite-build-errors.md](./vite-build-errors.md)         | Vite 7 + PowerSync 构建失败、dev 404 | `iife`, `worker format`, `optimizeDeps` |
| [tailwind-v4-migration.md](./tailwind-v4-migration.md) | Tailwind v4 语法变更                 | `@import`, `@apply`, `@layer`           |

## PowerSync

| 文件                                                             | 问题                                  | 关键词                                    |
| ---------------------------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| [powersync-setup.md](./powersync-setup.md)                       | PowerSync 云端配置完整指南            | 云实例, JWKS, Supabase 连接               |
| [powersync-sync-rules.md](./powersync-sync-rules.md)             | Sync Streams 语法错误与正确写法       | `edition: 3`, `auth.user_id()`, `{param}` |
| [powersync-worker-404.md](./powersync-worker-404.md)             | WASQLiteDB.worker.js 404 + 初始化卡住 | `useWebWorker`, `enableMultiTabs`, Tauri  |
| [powersync-provider-context.md](./powersync-provider-context.md) | PowerSyncContext 类型不匹配           | `AbstractPowerSyncDatabase`, `null`       |

## Supabase

| 文件                                               | 问题                             | 关键词                                |
| -------------------------------------------------- | -------------------------------- | ------------------------------------- |
| [supabase-migrations.md](./supabase-migrations.md) | 迁移脚本中的坑：触发器、向量维度 | `handle_new_user`, `vector(384)`, RLS |

## Tauri

| 文件                                       | 问题             | 关键词                          |
| ------------------------------------------ | ---------------- | ------------------------------- |
| [tauri-deep-link.md](./tauri-deep-link.md) | OAuth 回调不工作 | `deep-link:default`, capability |

---

> 发现新坑？在对应模块的 md 文件中追加，或创建新文件后更新本 index。
