import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseAnonKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// GET /auth/oauth/google - Initiate Google OAuth
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const redirectURL = url.searchParams.get('redirect_url') || url.origin;

        // Validate redirect URL against allowed list
        const allowedRedirects = (process.env.ALLOWED_OAUTH_REDIRECTS || url.origin).split(',');
        if (!allowedRedirects.some((allowed) => redirectURL.startsWith(allowed.trim()))) {
            return errorResponse('Invalid redirect URL', 400);
        }

        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();

        // Generate state for CSRF protection
        const state = randomBytes(32).toString('base64url');

        // Store state in Supabase for verification
        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase.from('oauth_states').upsert({
            state,
            provider: 'google',
            redirect_url: redirectURL,
            created_at: now,
            expires_at: expiresAt,
        });

        // Build Google OAuth URL via Supabase Auth
        const callbackURL = `${url.origin}/api/v1/auth/oauth/google/callback`;
        const authURL = `${supabaseURL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackURL)}&state=${state}`;

        return jsonResponse({
            auth_url: authURL,
            state,
        });
    } catch (error: unknown) {
        console.error('OAuth initiate error:', error);
        return errorResponse('Internal server error', 500);
    }
}
