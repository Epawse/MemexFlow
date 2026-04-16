import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { supabase } from './supabase';

/**
 * Initialize deep-link handler for OAuth callbacks
 *
 * When user completes OAuth flow in browser, they're redirected to:
 * memexflow://auth/callback#access_token=...&refresh_token=...
 *
 * This handler extracts the tokens and completes the Supabase session
 */
export async function initDeepLinkHandler() {
  try {
    await onOpenUrl((urls) => {
      for (const url of urls) {
        console.log('Deep link received:', url);

        // Parse OAuth callback
        if (url.startsWith('memexflow://auth/callback')) {
          handleAuthCallback(url);
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize deep-link handler:', error);
  }
}

async function handleAuthCallback(url: string) {
  try {
    // Extract hash fragment (contains tokens)
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) {
      console.error('No hash fragment in callback URL');
      return;
    }

    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      console.error('No access token in callback');
      return;
    }

    // Set the session in Supabase
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (error) {
      console.error('Failed to set session:', error);
      return;
    }

    console.log('OAuth authentication successful');
  } catch (error) {
    console.error('Error handling auth callback:', error);
  }
}
