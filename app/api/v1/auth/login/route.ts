import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseAnonKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody<{ email: string; password: string }>(req);
        if (!body) return errorResponse('Invalid request body');

        const { email, password } = body;
        if (!email || !email.includes('@')) return errorResponse('Valid email is required');
        if (!password?.trim()) return errorResponse('Password is required');

        const supabase = getSupabaseAdmin();
        const ipAddress = getClientIP(req);
        const userAgent = getUserAgent(req);

        // Verify password with Supabase Auth
        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();

        const authResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
            body: JSON.stringify({ email, password }),
        });

        if (!authResp.ok) {
            // Record failed login
            const { data: userRecord } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (userRecord) {
                // Check / update lockout
                const { data: lockout } = await supabase
                    .from('account_lockouts')
                    .select('*')
                    .eq('user_id', userRecord.id)
                    .single();

                if (lockout) {
                    const newAttempts = (lockout.failed_attempts || 0) + 1;
                    const lockedUntil = newAttempts >= 5
                        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                        : lockout.locked_until;
                    await supabase
                        .from('account_lockouts')
                        .update({ failed_attempts: newAttempts, locked_until: lockedUntil })
                        .eq('user_id', userRecord.id);
                } else {
                    await supabase.from('account_lockouts').insert({
                        user_id: userRecord.id,
                        failed_attempts: 1,
                        created_at: new Date().toISOString(),
                    });
                }
            }

            await supabase.from('security_events').insert({
                user_id: userRecord?.id || null,
                event_type: 'login_attempt',
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                details: 'invalid_credentials',
                created_at: new Date().toISOString(),
            });

            return errorResponse('Invalid credentials', 401);
        }

        const authData = await authResp.json();
        const accessToken = authData.access_token;

        // Get user by email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) return errorResponse('Invalid credentials', 401);

        // Check lockout
        const { data: lockout } = await supabase
            .from('account_lockouts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
            return errorResponse('Account temporarily locked due to multiple failed login attempts', 423);
        }

        // Check active
        if (!user.is_active) {
            return errorResponse('Account is inactive', 403);
        }

        // Reset failed attempts
        await supabase
            .from('account_lockouts')
            .delete()
            .eq('user_id', user.id);

        // Create session
        const now = new Date().toISOString();
        const sessionID = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: user.id,
            token_id: accessToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: now,
            expires_at: expiresAt,
            last_activity: now,
            is_active: true,
        });

        // Log success
        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'login',
            ip_address: ipAddress,
            user_agent: userAgent,
            success: true,
            created_at: now,
        });

        const permissions = getRolePermissions(user.role);

        return jsonResponse({
            token: accessToken,
            refreshToken: sessionID,
            expiresIn: 86400,
            user,
            roles: [user.role],
            permissions,
        });
    } catch (error: unknown) {
        console.error('Login error:', error);
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
