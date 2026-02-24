import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey, getSupabaseAnonKey } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// GET /admin/stats
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const supabase = getSupabaseAdmin();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Parallel queries for stats
        const [
            { count: totalUsers },
            { count: totalPosts },
            { count: totalComments },
            { count: totalAdmins },
            { count: newUsersToday },
            { count: newPostsToday },
            { count: newCommentsToday },
            { count: totalLikes },
            { count: totalBookmarks },
            { count: totalMedia },
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('posts').select('*', { count: 'exact', head: true }),
            supabase.from('comments').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['admin', 'super_admin']),
            supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
            supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
            supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
            supabase.from('likes').select('*', { count: 'exact', head: true }),
            supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
            supabase.from('media').select('*', { count: 'exact', head: true }),
        ]);

        return jsonResponse({
            total_users: totalUsers || 0,
            total_posts: totalPosts || 0,
            total_comments: totalComments || 0,
            total_admins: totalAdmins || 0,
            active_users: totalUsers || 0,
            new_users_today: newUsersToday || 0,
            new_posts_today: newPostsToday || 0,
            new_comments_today: newCommentsToday || 0,
            total_likes: totalLikes || 0,
            total_bookmarks: totalBookmarks || 0,
            total_media: totalMedia || 0,
        });
    } catch (error: unknown) {
        console.error('Admin stats error:', error);
        return errorResponse('Internal server error', 500);
    }
}
