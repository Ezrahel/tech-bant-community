import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error || !user) return errorResponse('User not found', 404);

        // Actual posts count
        const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', id);

        if (count !== null && count !== user.posts_count) {
            user.posts_count = count;
            await supabase.from('users').update({ posts_count: count }).eq('id', id);
        }

        return jsonResponse(user);
    } catch (error: unknown) {
        console.error('Get user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
