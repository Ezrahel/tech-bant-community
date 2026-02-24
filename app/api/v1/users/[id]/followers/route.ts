import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/[id]/followers
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: follows } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', id);

        if (!follows?.length) return jsonResponse([]);

        const followerIds = follows.map((f) => f.follower_id);
        const { data: users } = await supabase
            .from('users')
            .select('id, name, email, avatar, is_admin, is_verified')
            .in('id', followerIds);

        return jsonResponse(users || []);
    } catch (error: unknown) {
        console.error('Get followers error:', error);
        return errorResponse('Internal server error', 500);
    }
}
