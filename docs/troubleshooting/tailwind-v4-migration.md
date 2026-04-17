# Tailwind CSS v4 语法迁移

## 问题 1: `@tailwind` 指令不识别

### 症状

```
[postcss] tailwindcss: Cannot apply unknown utility class `border-gray-200`
```

或

```
@tailwind base;  ← 不被识别
```

### 原因

Tailwind v4 移除了 `@tailwind base/components/utilities` 指令，改为 `@import "tailwindcss"`。

### 解决

```css
/* ❌ v3 写法 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ v4 写法 */
@import "tailwindcss";
```

---

## 问题 2: `@apply` 在 `@layer base` 中报错

### 症状

```css
@layer base {
  * {
    @apply border-gray-200 dark:border-gray-700; /* 报错 */
  }
}
```

Tailwind v4 的 `@apply` 在某些上下文中不能引用尚未注册的 utility。

### 解决

直接在 HTML/组件中使用 Tailwind 类代替 `@layer base @apply`，或者改用原生 CSS：

```css
@layer base {
  *,
  *::before,
  *::after {
    border-color: var(--color-gray-200, #e5e7eb);
  }
  .dark *,
  .dark *::before,
  .dark *::after {
    border-color: var(--color-gray-700, #334155);
  }
}
```

---

## 问题 3: 自定义颜色 token 格式变更

### 原因

Tailwind v4 的 `tailwind.config.js` 中颜色定义变化不大，但注意 v4 已经内置了更丰富的色板。

### 经验

- `primary`、`secondary` 等自定义色仍然在 `theme.extend.colors` 中定义
- v4 内置了 `surface`、`success`、`warning`、`danger` 等语义色（如果没冲突可以直接用内置的）
- Dark mode 用 `.dark` 类（v4 默认策略）或 `@media (prefers-color-scheme: dark)`
