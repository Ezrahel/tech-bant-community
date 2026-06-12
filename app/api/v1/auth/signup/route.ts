import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getClientIP, getUserAgent, setAuthCookies, getRolePermissions } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseAnon } from '@/lib/supabase';
import { randomBytes } from 'crypto';
import { validateSignupPayload } from '@/lib/validation';

const WELCOME_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="padding:40px 40px 0;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px">Welcome to TechBant</h1>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.5">You're now part of a community of tech enthusiasts</p>
            <div style="height:40px"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;line-height:1.6">Hey <strong>{{name}}</strong>,</p>
            <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6">Thanks for joining TechBant Community! Your account has been created successfully.</p>
            <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6">You can now:</p>
            <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#4a4a4a;font-size:15px;line-height:1.8">
              <li>Browse and join discussions</li>
              <li>Share your tech experiences</li>
              <li>Connect with like-minded people</li>
              <li>Bookmark your favorite posts</li>
            </ul>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="{{siteUrl}}/discussions"
                     style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">
                    Start Exploring
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #e8e8e8">
            <p style="margin:0;color:#888888;font-size:12px;text-align:center">
              TechBant Community &middot; Built for tech enthusiasts, by tech enthusiasts<br>
              If you didn't create this account, please ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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

        // Send welcome email via Resend
        try {
            const siteUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || process.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'https://nothing-community.vercel.app';
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || 'TechBant <noreply@techbantcommunity.com>',
                    to: email,
                    subject: 'Welcome to TechBant Community!',
                    html: WELCOME_HTML.replace('{{name}}', name).replace('{{siteUrl}}', siteUrl),
                }),
            });
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

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


