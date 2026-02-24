import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseAnonKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string; password: string; name: string }>(req);
        if (!body) return errorResponse('Invalid request body');

        const { email, password, name } = body;

        // Validate input
        if (!email || !email.includes('@')) return errorResponse('Valid email is required');
        if (!password || password.length < 8) return errorResponse('Password must be at least 8 characters');
        if (!name?.trim()) return errorResponse('Name is required');

        const supabase = getSupabaseAdmin();
        const ipAddress = getClientIP(req);
        const userAgent = getUserAgent(req);

        // Check if email already exists in our users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return errorResponse('Unable to create account', 409);
        }

        // Create user in Supabase Auth via REST API
        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();

        const authResp = await fetch(`${supabaseURL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
            },
            body: JSON.stringify({
                email,
                password,
                data: { name },
            }),
        });

        const authData = await authResp.json();
        if (!authResp.ok) {
            return errorResponse(authData.msg || authData.error_description || 'Signup failed', authResp.status);
        }

        const userID = authData.user?.id;
        if (!userID) return errorResponse('Failed to create user');

        // Get access token
        let accessToken = authData.access_token || '';

        // If no token returned (email confirmation required), sign in to get one
        if (!accessToken) {
            const signInResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
                body: JSON.stringify({ email, password }),
            });
            if (signInResp.ok) {
                const signInData = await signInResp.json();
                accessToken = signInData.access_token || '';
            }
        }

        const now = new Date().toISOString();
        const avatar = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop';

        // Create user profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: userID,
                name: name.trim(),
                email,
                avatar,
                is_admin: false,
                is_verified: false,
                is_active: true,
                role: 'user',
                provider: 'email',
                posts_count: 0,
                followers_count: 0,
                following_count: 0,
                created_at: now,
                updated_at: now,
            });

        if (profileError) {
            console.error('Failed to create user profile:', profileError);
            return errorResponse('Failed to create user profile', 500);
        }

        // Create session
        const sessionID = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: userID,
            token_id: accessToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: now,
            expires_at: expiresAt,
            last_activity: now,
            is_active: true,
        });

        // Log security event
        await supabase.from('security_events').insert({
            user_id: userID,
            event_type: 'signup',
            ip_address: ipAddress,
            user_agent: userAgent,
            success: true,
            created_at: now,
        });

        // Get user profile
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', userID)
            .single();

        return jsonResponse({
            token: accessToken,
            refreshToken: sessionID,
            expiresIn: 86400,
            user,
            roles: [user?.role || 'user'],
            permissions: getRolePermissions(user?.role || 'user'),
        }, 201);
    } catch (error: unknown) {
        console.error('Signup error:', error);
        return errorResponse('Internal server error', 500);
    }
}

function getRolePermissions(role: string): string[] {
    switch (role) {
        case 'super_admin':
            return ['read', 'write', 'delete', 'admin', 'manage_admins', 'manage_roles', 'view_analytics'];
        case 'admin':
            return ['read', 'write', 'delete', 'admin', 'view_analytics'];
        default:
            return ['read', 'write'];
    }
}
