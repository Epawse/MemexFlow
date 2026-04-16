# 认证设置快速指南

## 前置条件

- Supabase 项目已创建（项目 ID: vwloyomsrbrefuwfmnln）
- 数据库 schema 已部署
- 环境变量已配置（.env 文件）

## 步骤 1: 配置 Supabase 认证 URL

1. 打开 Supabase 仪表板：
   ```
   https://supabase.com/dashboard/project/vwloyomsrbrefuwfmnln/auth/url-configuration
   ```

2. 在 **Redirect URLs** 部分，添加以下两个 URL：
   ```
   memexflow://auth/callback
   http://localhost:1420/auth/callback
   ```
   
   - 第一个用于生产应用（deep-link）
   - 第二个用于开发环境

3. 点击 **Save** 保存

## 步骤 2: 启动开发服务器

在项目根目录运行：

```bash
npm run tauri dev
```

等待编译完成，应用窗口会自动打开。

## 步骤 3: 测试 Email/Password 认证

### 注册新用户

1. 在登录页面，点击 **Sign Up** 标签
2. 输入邮箱和密码（密码至少 6 位）
3. 点击 **Sign Up** 按钮
4. 检查邮箱，点击确认链接（Supabase 发送的确认邮件）
5. 返回应用，使用相同邮箱密码登录

### 登录已有用户

1. 在登录页面，保持 **Sign In** 标签选中
2. 输入邮箱和密码
3. 点击 **Sign In** 按钮
4. 成功后会跳转到主页面

## 步骤 4: （可选）配置 OAuth 提供商

### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 创建 **OAuth 2.0 Client ID**：
   - Application type: Web application
   - Authorized redirect URIs: 
     ```
     https://vwloyomsrbrefuwfmnln.supabase.co/auth/v1/callback
     ```
5. 复制 Client ID 和 Client Secret
6. 在 Supabase 仪表板：
   ```
   https://supabase.com/dashboard/project/vwloyomsrbrefuwfmnln/auth/providers
   ```
7. 找到 **Google** 提供商，点击启用
8. 粘贴 Client ID 和 Client Secret
9. 点击 **Save**

### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **New OAuth App**
3. 填写信息：
   - Application name: MemexFlow
   - Homepage URL: https://memexflow.app（或你的域名）
   - Authorization callback URL:
     ```
     https://vwloyomsrbrefuwfmnln.supabase.co/auth/v1/callback
     ```
4. 点击 **Register application**
5. 复制 Client ID，生成并复制 Client Secret
6. 在 Supabase 仪表板：
   ```
   https://supabase.com/dashboard/project/vwloyomsrbrefuwfmnln/auth/providers
   ```
7. 找到 **GitHub** 提供商，点击启用
8. 粘贴 Client ID 和 Client Secret
9. 点击 **Save**

## 步骤 5: 测试 OAuth 认证

**注意**: OAuth deep-link 在开发模式下可能不工作，需要构建生产版本测试。

### 构建生产版本

```bash
npm run tauri build
```

构建完成后，在 `src-tauri/target/release/bundle/` 找到安装包：
- macOS: `dmg/MemexFlow_0.1.0_aarch64.dmg`
- Windows: `msi/MemexFlow_0.1.0_x64_en-US.msi`

### 测试 OAuth 流程

1. 安装并启动应用
2. 在登录页面，点击 **Google** 或 **GitHub** 按钮
3. 浏览器打开 OAuth 授权页面
4. 同意授权
5. 浏览器重定向到 `memexflow://auth/callback`
6. 应用自动接收 token 并登录
7. 跳转到主页面

## 验证认证状态

### 检查浏览器控制台

在开发模式下，打开浏览器开发者工具（右键 → Inspect）：

```javascript
// 应该看到类似输出
console.log('Auth state changed:', { user: {...}, session: {...} })
```

### 检查数据库

在 Supabase 仪表板查看用户表：
```
https://supabase.com/dashboard/project/vwloyomsrbrefuwfmnln/auth/users
```

应该能看到新注册的用户。

## 常见问题

### 1. "Invalid redirect URL" 错误

**原因**: Supabase 中未配置 redirect URL

**解决**: 确保在步骤 1 中正确添加了两个 redirect URL

### 2. OAuth 弹窗被浏览器拦截

**原因**: 浏览器默认拦截弹窗

**解决**: 允许浏览器弹窗，或在浏览器设置中添加例外

### 3. Deep-link 不工作

**原因**: 开发模式下 deep-link 可能不生效

**解决**: 
- 先测试 Email/Password 认证
- 或构建生产版本测试 OAuth

### 4. "Not authenticated" 错误

**原因**: PowerSync 初始化时用户未登录

**解决**: 
- 确保先登录再访问需要认证的页面
- 检查 JWT token 是否有效（未过期）

### 5. 邮件确认链接无效

**原因**: Supabase 默认需要邮箱确认

**解决**: 
- 检查垃圾邮件文件夹
- 或在 Supabase 仪表板禁用邮箱确认：
  ```
  Authentication → Settings → Email Auth → Disable "Confirm email"
  ```

## 下一步

认证设置完成后，可以继续：

1. 测试 PowerSync 离线同步（需要先登录）
2. 开发基础 UI 组件库
3. 实现 Capture 和 Memory 功能

## 技术细节

### 认证流程图

```
Email/Password:
用户输入凭据 → Supabase Auth 验证 → 返回 JWT tokens
  → 存储在 AuthProvider context → PowerSync 使用 token 同步

OAuth:
用户点击 OAuth 按钮 → 打开浏览器授权页面 → 用户同意
  → Provider 重定向到 Supabase callback
  → Supabase 重定向到 memexflow://auth/callback
  → Deep-link handler 提取 tokens
  → 调用 supabase.auth.setSession()
  → 用户登录成功
```

### 安全说明

- JWT tokens 仅存储在内存中（不使用 localStorage）
- Refresh tokens 由 Supabase client 自动处理
- 所有数据库访问受 Row Level Security (RLS) 保护
- Deep-link 仅接受来自可信 Supabase 域名的 token

### 相关文件

- `src/lib/AuthProvider.tsx` - 认证上下文和会话管理
- `src/features/auth/LoginPage.tsx` - 登录页面 UI
- `src/lib/deep-link.ts` - Deep-link OAuth 回调处理
- `src-tauri/tauri.conf.json` - Deep-link scheme 配置
- `src-tauri/src/lib.rs` - Rust deep-link 插件初始化
