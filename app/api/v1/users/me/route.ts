import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /users/me
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user: authUser } = authResult;

        const supabase = getSupabaseAdmin();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !user) return errorResponse('User not found', 404);

        // Get actual posts count
        const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', authUser.id);

        if (count !== null && count !== user.posts_count) {
            user.posts_count = count;
            await supabase.from('users').update({ posts_count: count }).eq('id', authUser.id);
        }

        return jsonResponse(user);
    } catch (error: unknown) {
        console.error('Get me error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PUT /users/me
export async function PUT(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user: authUser } = authResult;

        const body = await parseBody<{
            name?: string;
            bio?: string;
            location?: string;
            website?: string;
            avatar?: string;
        }>(req);
        if (!body) return errorResponse('Invalid request body');

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.name) {
            const name = body.name.trim().replace(/<[^>]*>/g, '');
            if (name.length < 1 || name.length > 100) return errorResponse('Name must be 1-100 characters');
            updates.name = name;
        }
        if (body.bio !== undefined) {
            const bio = body.bio.trim().replace(/<[^>]*>/g, '');
            if (bio.length > 500) return errorResponse('Bio must be less than 500 characters');
            updates.bio = bio;
        }
        if (body.location !== undefined) {
            updates.location = body.location.trim().replace(/<[^>]*>/g, '').slice(0, 100);
        }
        if (body.website !== undefined) {
            updates.website = body.website;
        }
        if (body.avatar !== undefined) {
            updates.avatar = body.avatar;
        }

        const supabase = getSupabaseAdmin();
        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', authUser.id)
            .select('*')
            .single();

        if (error) return errorResponse('Failed to update profile', 500);
        return jsonResponse(user);
    } catch (error: unknown) {
        console.error('Update me error:', error);
        return errorResponse('Internal server error', 500);
    }
}
