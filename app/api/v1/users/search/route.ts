import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/search?q=...&limit=...
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('q') || '';
        let limit = parseInt(url.searchParams.get('limit') || '10');
        if (limit <= 0) limit = 10;
        if (limit > 100) limit = 100;

        if (!query) return jsonResponse([]);

        const supabase = getSupabaseAdmin();
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('name')
            .limit(limit);

        if (error) return errorResponse('Search failed', 500);
        return jsonResponse(users || []);
    } catch (error: unknown) {
        console.error('Search users error:', error);
        return errorResponse('Internal server error', 500);
    }
}
