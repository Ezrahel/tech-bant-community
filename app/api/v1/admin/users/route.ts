import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, paginationParams, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /admin/users
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const { limit, offset } = paginationParams(req);
        const supabase = getSupabaseAdmin();
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';
        const role = url.searchParams.get('role') || '';

        let query = supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (role) {
            query = query.eq('role', role);
        }

        const { data: users, error } = await query;
        if (error) return errorResponse('Failed to fetch users', 500);

        return jsonResponse(users || []);
    } catch (error: unknown) {
        console.error('Admin users error:', error);
        return errorResponse('Internal server error', 500);
    }
}
