import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /posts/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: post, error } = await supabase
            .from('posts')
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .eq('id', id)
            .single();

        if (error || !post) return errorResponse('Post not found', 404);

        // Increment views
        await supabase
            .from('posts')
            .update({ views: (post.views || 0) + 1 })
            .eq('id', id);

        return jsonResponse(post);
    } catch (error: unknown) {
        console.error('Get post error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PUT /posts/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        // Verify ownership
        const { data: existing } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) return errorResponse('Post not found', 404);
        if (existing.author_id !== user.id) return errorResponse('Unauthorized', 403);

        const body = await parseBody<{
            title?: string;
            content?: string;
            category?: string;
            tags?: string[];
            location?: string;
        }>(req);
        if (!body) return errorResponse('Invalid request body');

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.title) updates.title = body.title;
        if (body.content) updates.content = body.content;
        if (body.category) updates.category = body.category;
        if (body.tags) updates.tags = body.tags;
        if (body.location) updates.location = body.location;

        const { data: post, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id)
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .single();

        if (error) return errorResponse('Failed to update post', 500);

        return jsonResponse(post);
    } catch (error: unknown) {
        console.error('Update post error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        // Verify ownership
        const { data: existing } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) return errorResponse('Post not found', 404);
        if (existing.author_id !== user.id) return errorResponse('Unauthorized', 403);

        // Delete post (CASCADE handles related records)
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) return errorResponse('Failed to delete post', 500);

        // Decrement user posts count
        const { data: userProfile } = await supabase
            .from('users')
            .select('posts_count')
            .eq('id', user.id)
            .single();

        if (userProfile) {
            await supabase
                .from('users')
                .update({ posts_count: Math.max(0, (userProfile.posts_count || 0) - 1) })
                .eq('id', user.id);
        }

        return jsonResponse({ message: 'Post deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
