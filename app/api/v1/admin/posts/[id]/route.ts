import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// DELETE /admin/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const supabase = getSupabaseAdmin();

        const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
        if (!post) return errorResponse('Post not found', 404);

        await supabase.from('posts').delete().eq('id', postId);

        // Decrement author's post count
        const { data: author } = await supabase.from('users').select('posts_count').eq('id', post.author_id).single();
        if (author) {
            await supabase.from('users').update({ posts_count: Math.max(0, (author.posts_count || 0) - 1) }).eq('id', post.author_id);
        }

        return jsonResponse({ message: 'Post deleted successfully' });
    } catch (error: unknown) {
        console.error('Admin delete post error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PUT /admin/posts/[id] - Update post (pin, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const body = await parseBody<{ is_pinned?: boolean; is_hot?: boolean }>(req);
        if (!body) return errorResponse('Invalid request body');

        const supabase = getSupabaseAdmin();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;
        if (body.is_hot !== undefined) updates.is_hot = body.is_hot;

        const { data: post, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', postId)
            .select('*')
            .single();

        if (error || !post) return errorResponse('Failed to update post', 500);
        return jsonResponse(post);
    } catch (error: unknown) {
        console.error('Admin update post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
