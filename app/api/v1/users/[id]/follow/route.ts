import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /users/[id]/follow - Toggle follow
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        if (user.id === targetId) return errorResponse('Cannot follow yourself', 400);

        const supabase = getSupabaseAdmin();

        // Check existing follow
        const { data: existing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetId)
            .single();

        if (existing) {
            // Unfollow
            await supabase.from('follows').delete().eq('id', existing.id);

            // Decrement counts
            const { data: followerProfile } = await supabase.from('users').select('following_count').eq('id', user.id).single();
            const { data: targetProfile } = await supabase.from('users').select('followers_count').eq('id', targetId).single();

            await supabase.from('users').update({ following_count: Math.max(0, (followerProfile?.following_count || 0) - 1) }).eq('id', user.id);
            await supabase.from('users').update({ followers_count: Math.max(0, (targetProfile?.followers_count || 0) - 1) }).eq('id', targetId);

            return jsonResponse({ message: 'Unfollowed successfully' });
        } else {
            // Follow
            await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: targetId,
                created_at: new Date().toISOString(),
            });

            // Increment counts
            const { data: followerProfile } = await supabase.from('users').select('following_count').eq('id', user.id).single();
            const { data: targetProfile } = await supabase.from('users').select('followers_count').eq('id', targetId).single();

            await supabase.from('users').update({ following_count: (followerProfile?.following_count || 0) + 1 }).eq('id', user.id);
            await supabase.from('users').update({ followers_count: (targetProfile?.followers_count || 0) + 1 }).eq('id', targetId);

            return jsonResponse({ message: 'Followed successfully' });
        }
    } catch (error: unknown) {
        console.error('Follow error:', error);
        return errorResponse('Internal server error', 500);
    }
}
