import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent, setAuthCookies } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseAnon } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import { validateSignupPayload } from '@/lib/validation';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string; password: string; name: string }>(req);
        const validation = validateSignupPayload(body);
        if (!validation.ok) return errorResponse(validation.error);

        const { email, password, name } = validation.data;

        const supabase = getSupabaseAdmin();
        const supabaseAnon = getSupabaseAnon();
        const ipAddress = getClientIP(req);
        const userAgent = getUserAgent(req);

        // Check if email already exists in our users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            console.log('User already exists in users table:', email);
            return errorResponse('Unable to create account', 409);
        }

        // Create user in Supabase Auth using the SDK
        // We use the admin client to bypass confirmation if possible, or skip triggers
        // But for standard signup with email/password, we can use the admin client
        // to manage auth precisely.
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for this setup
            user_metadata: { name }
        });

        if (authError || !authData.user) {
            console.error('Supabase signup error:', authError);
            return errorResponse(authError?.message || 'Signup failed', 400);
        }

        const userID = authData.user.id;

        // Get access token - since we created the user as admin, we might need to sign in
        // or just proceed if we don't need the user's session token for the profile creation
        // (which we don't since we use the admin client for DB operations)
        let accessToken = '';
        let supabaseRefreshToken = '';
        let accessTokenExpiresIn = 3600;
        const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
            email,
            password
        });

        if (!signInError && signInData.session) {
            accessToken = signInData.session.access_token;
            supabaseRefreshToken = signInData.session.refresh_token;
            accessTokenExpiresIn = signInData.session.expires_in || 3600;
        }

        if (!accessToken || !supabaseRefreshToken) {
            await supabase.auth.admin.deleteUser(userID);
            return errorResponse('Failed to create authenticated session', 500);
        }

        const now = new Date().toISOString();
        const avatar = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop';
        const profile = {
            id: userID,
            name,
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
        };

        // Create user profile
        const { error: profileError } = await supabase
            .from('users')
            .upsert(profile, { onConflict: 'id' });

        if (profileError) {
            console.error('Failed to create user profile:', profileError);

            await supabase.auth.admin.deleteUser(userID).catch((cleanupError) => {
                console.error('Failed to clean up auth user after profile creation error:', cleanupError);
            });

            if (profileError.code === '23505') {
                return errorResponse('An account with this email already exists', 409);
            }

            return errorResponse(profileError.message || 'Failed to create user profile', 500);
        }

        // Create session
        const sessionID = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: userID,
            token_id: supabaseRefreshToken,
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

        const response = jsonResponse({
            token: accessToken,
            refreshToken: sessionID,
            expiresIn: accessTokenExpiresIn,
            user,
            roles: [user?.role || 'user'],
            permissions: getRolePermissions(user?.role || 'user'),
        }, 201);

        return setAuthCookies(response, accessToken, sessionID);
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
