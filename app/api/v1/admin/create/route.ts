import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin, withSuperAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseAnonKey, getSupabaseServiceKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// POST /admin/create - Create admin user
export async function POST(req: NextRequest) {
    try {
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;

        const body = await parseBody<{ name: string; email: string; password: string; role: string }>(req);
        if (!body?.email || !body?.password || !body?.name) {
            return errorResponse('Name, email, and password are required');
        }

        const role = body.role || 'admin';
        if (role !== 'admin' && role !== 'super_admin') {
            return errorResponse('Invalid role');
        }

        const supabase = getSupabaseAdmin();
        const supabaseURL = getSupabaseURL();
        const anonKey = getSupabaseAnonKey();
        const serviceKey = getSupabaseServiceKey();

        // Check existing user
        const { data: existing } = await supabase.from('users').select('id').eq('email', body.email).single();
        if (existing) return errorResponse('Email already exists', 409);

        // Create in Supabase Auth
        const authResp = await fetch(`${supabaseURL}/auth/v1/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
            body: JSON.stringify({ email: body.email, password: body.password, data: { name: body.name } }),
        });

        const authData = await authResp.json();
        if (!authResp.ok || !authData.user?.id) {
            return errorResponse('Failed to create user in auth', 500);
        }

        const userID = authData.user.id;
        const now = new Date().toISOString();

        // Create user profile with admin role
        const { error } = await supabase.from('users').insert({
            id: userID,
            name: body.name.trim(),
            email: body.email,
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop',
            is_admin: true,
            is_verified: true,
            is_active: true,
            role,
            provider: 'email',
            posts_count: 0,
            followers_count: 0,
            following_count: 0,
            created_at: now,
            updated_at: now,
        });

        if (error) return errorResponse('Failed to create user profile', 500);

        const { data: user } = await supabase.from('users').select('*').eq('id', userID).single();

        return jsonResponse(user, 201);
    } catch (error: unknown) {
        console.error('Admin create error:', error);
        return errorResponse('Internal server error', 500);
    }
}
