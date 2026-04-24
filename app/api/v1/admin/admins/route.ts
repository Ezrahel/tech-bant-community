import { NextRequest } from 'next/server';
import { errorResponse, jsonResponse, paginationParams, parseBody, withAdmin, withSuperAdmin } from '@/lib/api-helpers';
import { createAdminUser } from '@/lib/admin-users';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateAdminCreationPayload } from '@/lib/validation';

// GET /admin/admins
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const { limit, offset } = paginationParams(req);
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';

        let query = getSupabaseAdmin()
            .from('users')
            .select('*')
            .in('role', ['admin', 'super_admin'])
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: admins, error } = await query;
        if (error) return errorResponse('Failed to fetch admins', 500);

        return jsonResponse({ admins: admins || [] });
    } catch (error: unknown) {
        console.error('Admin list error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /admin/admins
export async function POST(req: NextRequest) {
    try {
        const authResult = await withSuperAdmin(req);
        if (authResult instanceof Response) return authResult;

        const body = await parseBody<{ name?: string; email?: string; password?: string; role?: string }>(req);
        const validation = validateAdminCreationPayload(body);
        if (!validation.ok) return errorResponse(validation.error);

        const user = await createAdminUser(validation.data);
        return jsonResponse(user, 201);
    } catch (error: unknown) {
        console.error('Admin create error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        const status = message === 'A user with this email already exists' ? 409 : 500;
        return errorResponse(message, status);
    }
}
