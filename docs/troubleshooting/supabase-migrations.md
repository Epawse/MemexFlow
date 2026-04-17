# Supabase 迁移脚本踩坑

## 问题 1: Embedding 向量维度不匹配

### 症状

Worker 插入 memory 时报错：

```
ERROR: expected 1536 dimensions, not 384
```

### 原因

初始 schema 定义 `embedding vector(1536)`（OpenAI text-embedding-ada-2 的维度），但 Python worker 使用 `all-MiniLM-L6-v2`（384 维）。

### 解决

迁移脚本中将向量维度改为 384：

```sql
ALTER TABLE public.memories ALTER COLUMN embedding TYPE vector(384) USING NULL;
CREATE INDEX idx_memories_embedding ON public.memories USING ivfflat (embedding vector_cosine_ops);
```

同时更新 `match_memories()` 函数签名：

```sql
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(384),  -- 不是 1536
  ...
)
```

### 经验法则

| 模型                          | 维度    |
| ----------------------------- | ------- |
| OpenAI text-embedding-ada-2   | 1536    |
| OpenAI text-embedding-3-small | 1536    |
| all-MiniLM-L6-v2 (本地)       | **384** |
| all-MiniLM-L12-v2 (本地)      | 384     |
| multilingual-e5-small (本地)  | 384     |

**选模型前先确认维度！**

---

## 问题 2: 新用户注册后 `public.users` 没有对应行

### 症状

Supabase Auth 注册成功，但查询 `public.users` 表找不到该用户。RLS 策略依赖 `public.users.id`，导致用户看不到自己的数据。

### 原因

Supabase Auth 只在 `auth.users` 中创建记录，不会自动在 `public.users` 中插入行。

### 解决

添加触发器，注册时自动创建 `public.users` 行：

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 要点

- `SECURITY DEFINER` 让触发器以定义者（超级用户）身份运行，绕过 RLS
- `COALESCE` 处理各种 OAuth 提供商的 display_name 字段名不一致
- `split_part(NEW.email, '@', 1)` 作为 display_name 的最后回退
