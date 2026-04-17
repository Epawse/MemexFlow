# Tailwind CSS v4 踩坑记录

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

### 解决

用原生 CSS 变量代替：

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

## 问题 3: 自定义颜色类完全不显示（按钮不可见）⚠️ 最关键

### 症状

使用 `bg-primary-600`、`text-primary-500` 的按钮或元素**完全不可见**——白色背景上白色文字，透明背景。但点击区域存在，功能正常。

### 原因

**Tailwind v4 不再从 `tailwind.config.js` 读取自定义颜色定义。**

v3 写法（v4 中不生效）：

```js
// tailwind.config.js — v4 中这些颜色不会被使用！
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 600: "#7C3AED", 700: "#6D28D9" },
      },
    },
  },
};
```

Tailwind v4 使用 CSS `@theme` 指令代替 JS 配置来定义设计 token。`tailwind.config.js` 里的自定义颜色被静默忽略。

### 解决

在 `src/index.css` 中用 `@theme` 声明颜色：

```css
@import "tailwindcss";

@theme {
  --color-primary-600: #7c3aed;
  --color-primary-700: #6d28d9;
  --color-primary-500: #8b5cf6;
  --color-primary: #6750a4;
  /* ... 其他色阶 */
}
```

之后 `bg-primary-600`、`text-primary-700` 等类名即刻生效。

### 关键规则对照

| Tailwind v3                                  | Tailwind v4                     |
| -------------------------------------------- | ------------------------------- |
| `tailwind.config.js` → `theme.extend.colors` | `index.css` → `@theme { }`      |
| `primary: { 600: '#7C3AED' }`                | `--color-primary-600: #7C3AED;` |
| JS 对象嵌套                                  | CSS 变量连字符命名              |
| `@tailwind base;`                            | `@import "tailwindcss";`        |

### 注意

- 内置颜色（`gray`、`blue`、`red` 等）仍可用
- 只有自定义命名的颜色（如 `primary`、`surface`、`success`）需要移到 `@theme`
- `tailwind.config.js` 可以保留用于其他配置（content paths、plugins 等），只是颜色主题不再从中读取
