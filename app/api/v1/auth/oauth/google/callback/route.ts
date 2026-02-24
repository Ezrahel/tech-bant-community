import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseAnonKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// GET /auth/oauth/google/callback - Handle Google OAuth callback
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) {
            return errorResponse('Missing authorization code', 400);
        }

        const supabase = getSupabaseAdmin();

        // Verify state if provided
        let redirectURL = url.origin;
        if (state) {
            const { data: oauthState } = await supabase
                .from('oauth_states')
                .select('*')
                .eq('state', state)
                .single();

            if (oauthState) {
                // Check expiry
                if (new Date(oauthState.expires_at) < new Date()) {
                    await supabase.from('oauth_states').delete().eq('state', state);
                    return errorResponse('OAuth state expired', 400);
                }
                redirectURL = oauthState.redirect_url || url.origin;
                // Delete used state
                await supabase.from('oauth_states').delete().eq('state', state);
            }
        }

        // Exchange code for session via Supabase Auth
        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();

        const tokenResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=pkce`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
            },
            body: JSON.stringify({
                auth_code: code,
                code_verifier: url.searchParams.get('code_verifier') || '',
            }),
        });

        // If PKCE flow doesn't work, try authorization_code grant
        let authData;
        if (!tokenResp.ok) {
            const altResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=authorization_code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                },
                body: JSON.stringify({ code }),
            });

            if (!altResp.ok) {
                return errorResponse('Failed to exchange authorization code', 400);
            }
            authData = await altResp.json();
        } else {
            authData = await tokenResp.json();
        }

        const accessToken = authData.access_token;
        const userID = authData.user?.id;

        if (!userID || !accessToken) {
            return errorResponse('Failed to authenticate with Google', 400);
        }

        // Get or create user profile in our users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userID)
            .single();

        const now = new Date().toISOString();
        let isNewUser = false;

        if (!existingUser) {
            isNewUser = true;
            const googleUser = authData.user;

            await supabase.from('users').insert({
                id: userID,
                name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || googleUser.email?.split('@')[0] || 'User',
                email: googleUser.email,
                avatar: googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture || '',
                is_admin: false,
                is_verified: googleUser.email_confirmed_at ? true : false,
                is_active: true,
                role: 'user',
                provider: 'google',
                posts_count: 0,
                followers_count: 0,
                following_count: 0,
                created_at: now,
                updated_at: now,
            });
        } else {
            // Update existing user with latest Google info
            const googleUser = authData.user;
            await supabase
                .from('users')
                .update({
                    avatar: googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture || existingUser.avatar,
                    is_verified: true,
                    updated_at: now,
                })
                .eq('id', userID);
        }

        // Create session
        const sessionID = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: userID,
            token_id: accessToken,
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            created_at: now,
            expires_at: expiresAt,
            last_activity: now,
            is_active: true,
        });

        // Redirect to frontend with token in fragment (security: prevents token in server logs/referrer)
        const fragmentParams = `token=${accessToken}&isNewUser=${isNewUser}`;
        return NextResponse.redirect(`${redirectURL}#${fragmentParams}`, 302);
    } catch (error: unknown) {
        console.error('OAuth callback error:', error);
        return errorResponse('Internal server error', 500);
    }
}
