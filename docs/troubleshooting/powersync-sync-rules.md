# PowerSync Sync Rules 语法错误

## 问题: Edition 3 使用 `{param}` 参数语法报错

### 症状

部署 sync rules 到 PowerSync Dashboard 时报错：

```
invalid syntax at line 1 col 103:
SELECT ... FROM users WHERE id = {user_id}
                                      ^
Unexpected input (lexer error). Instead, I was expecting to see one of the following:
  - A "lparen" token
  - A "word" token
  ...
```

每个包含 `{user_id}` 的查询都报同样的错。

### 原因

**Edition 3（Sync Streams）和旧版（Sync Rules）使用完全不同的参数语法**：

| 版本                     | 语法                             | 参数声明                          |
| ------------------------ | -------------------------------- | --------------------------------- |
| Edition 1-2 (Sync Rules) | `WHERE user_id = {user_id}`      | 需要 `params:` + `token.sub`      |
| Edition 3 (Sync Streams) | `WHERE user_id = auth.user_id()` | 不需要 params，直接用 `auth` 函数 |

### 错误写法（Edition 2 风格）

```yaml
config:
  edition: 3

streams:
  projects:
    params:
      user_id: token.sub
    queries:
      - SELECT * FROM projects WHERE user_id = {user_id} # ❌ 错误！
```

### 正确写法（Edition 3）

```yaml
config:
  edition: 3

streams:
  projects:
    auto_subscribe: true
    query: SELECT * FROM projects WHERE user_id = auth.user_id() # ✅ 正确
```

### 关键要点

1. Edition 3 用 `query`（单数）或 `queries`（复数），不用 `data`
2. `auth.user_id()` 直接引用 JWT 中的 `sub` claim
3. `auth` 函数是 PowerSync 内置的，不需要额外声明
4. `auto_subscribe: true` 让客户端自动订阅，无需手动调用
5. 不需要 `params` 和 `bucket_definitions`
