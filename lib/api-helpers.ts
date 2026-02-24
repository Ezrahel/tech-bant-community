import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabase';

// ---- JSON response helpers ----

export function jsonResponse(data: unknown, status = 200) {
    return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

// ---- Auth helpers ----

export interface AuthUser {
    id: string;
    email: string;
    role?: string;
    isAdmin?: boolean;
}

/**
 * Extract user from Bearer token using Supabase Auth API
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    if (!token) return null;

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return null;

        // Get user profile from public.users
        const { data: profile } = await supabase
            .from('users')
            .select('role, is_admin')
            .eq('id', data.user.id)
            .single();

        return {
            id: data.user.id,
            email: data.user.email || '',
            role: profile?.role || 'user',
            isAdmin: profile?.is_admin || false,
        };
    } catch {
        return null;
    }
}

/**
 * Require authentication - returns user or error response
 */
export async function withAuth(req: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
    const user = await getUserFromRequest(req);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }
    return { user };
}

/**
 * Require admin role - returns user or error response
 */
export async function withAdmin(req: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
    const result = await withAuth(req);
    if (result instanceof NextResponse) return result;

    const { user } = result;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return errorResponse('Forbidden: admin access required', 403);
    }
    return { user };
}

/**
 * Require super admin role
 */
export async function withSuperAdmin(req: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
    const result = await withAuth(req);
    if (result instanceof NextResponse) return result;

    const { user } = result;
    if (user.role !== 'super_admin') {
        return errorResponse('Forbidden: super admin access required', 403);
    }
    return { user };
}

// ---- Request helpers ----

export async function parseBody<T>(req: NextRequest): Promise<T | null> {
    try {
        return await req.json() as T;
    } catch {
        return null;
    }
}

export function paginationParams(req: NextRequest): { limit: number; offset: number } {
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get('limit') || '20');
    let offset = parseInt(url.searchParams.get('offset') || '0');

    if (limit <= 0) limit = 20;
    if (limit > 100) limit = 100;
    if (offset < 0) offset = 0;

    return { limit, offset };
}

export function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
}

export function getUserAgent(req: NextRequest): string {
    return req.headers.get('user-agent') || 'unknown';
}
