import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/[id]/following
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', id);

        if (!follows?.length) return jsonResponse([]);

        const followingIds = follows.map((f) => f.following_id);
        const { data: users } = await supabase
            .from('users')
            .select('id, name, email, avatar, is_admin, is_verified')
            .in('id', followingIds);

        return jsonResponse(users || []);
    } catch (error: unknown) {
        console.error('Get following error:', error);
        return errorResponse('Internal server error', 500);
    }
}
