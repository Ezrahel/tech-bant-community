import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PUBLIC_USER_COLUMNS, sanitizeSearchQuery } from '@/lib/security';

// GET /users/search?q=...&limit=...
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = sanitizeSearchQuery(url.searchParams.get('q') || '');
        let limit = parseInt(url.searchParams.get('limit') || '10');
        if (limit <= 0) limit = 10;
        if (limit > 100) limit = 100;

        if (!query) return jsonResponse([]);

        const supabase = getSupabaseAdmin();
        const { data: users, error } = await supabase
            .from('users')
            .select(PUBLIC_USER_COLUMNS)
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(limit);

        if (error) return errorResponse('Search failed', 500);
        return jsonResponse(users || []);
    } catch (error: unknown) {
        console.error('Search users error:', error);
        return errorResponse('Internal server error', 500);
    }
}
