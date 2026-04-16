# Authentication Setup Guide

## Step 1: Configure Supabase Auth

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/vwloyomsrbrefuwfmnln
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following redirect URLs:

### Redirect URLs
```
memexflow://auth/callback
http://localhost:1420/auth/callback
```

The first URL is for the production app (deep-link), the second is for development.

## Step 2: Enable OAuth Providers

### Google OAuth
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://vwloyomsrbrefuwfmnln.supabase.co/auth/v1/callback`

### GitHub OAuth
1. Go to **Authentication** → **Providers** → **GitHub**
2. Enable GitHub provider
3. Add OAuth credentials:
   - Get credentials from [GitHub Developer Settings](https://github.com/settings/developers)
   - Create OAuth App
   - Add authorization callback URL: `https://vwloyomsrbrefuwfmnln.supabase.co/auth/v1/callback`

## Step 3: Configure Email Auth (Optional)

If you want email/password authentication:

1. Go to **Authentication** → **Providers** → **Email**
2. Enable email provider
3. Configure email templates (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

## Step 4: Test Authentication

### Email/Password Flow
1. Start the app: `npm run tauri dev`
2. Click "Sign Up"
3. Enter email and password
4. Check email for confirmation link
5. Click link to confirm
6. Sign in with credentials

### OAuth Flow
1. Start the app: `npm run tauri dev`
2. Click "Google" or "GitHub"
3. Browser opens for OAuth consent
4. After consent, redirects to `memexflow://auth/callback`
5. App receives tokens via deep-link
6. User is signed in

## How It Works

### Email/Password
```
User enters credentials
  ↓
Supabase Auth validates
  ↓
Returns JWT tokens
  ↓
Stored in AuthProvider context
  ↓
PowerSync uses token for sync
```

### OAuth (Google/GitHub)
```
User clicks OAuth button
  ↓
Opens browser with OAuth URL
  ↓
User consents on provider site
  ↓
Provider redirects to Supabase callback
  ↓
Supabase redirects to memexflow://auth/callback
  ↓
Deep-link handler extracts tokens
  ↓
Calls supabase.auth.setSession()
  ↓
User is signed in
```

## Security Notes

1. **JWT Tokens**: Stored in memory only (not localStorage)
2. **Refresh Tokens**: Automatically handled by Supabase client
3. **RLS Policies**: All database access is protected by Row Level Security
4. **Deep Links**: Only accept tokens from trusted Supabase domain

## Troubleshooting

### "Invalid redirect URL" error
- Make sure `memexflow://auth/callback` is added to Supabase redirect URLs
- Check that deep-link plugin is properly configured in `tauri.conf.json`

### OAuth popup blocked
- Browser may block popup windows
- User needs to allow popups for the app

### "Not authenticated" error in PowerSync
- Make sure user is signed in before PowerSync initializes
- Check that JWT token is valid (not expired)

### Deep-link not working
- On macOS, the app must be built and installed (not just dev mode)
- Run `npm run tauri build` and install the .dmg
- Or test with email/password auth first
