import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// PUT /comments/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: commentId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        // Verify ownership
        const { data: existing } = await supabase
            .from('comments')
            .select('author_id')
            .eq('id', commentId)
            .single();

        if (!existing) return errorResponse('Comment not found', 404);
        if (existing.author_id !== user.id) return errorResponse('Unauthorized', 403);

        const body = await parseBody<{ content: string }>(req);
        if (!body?.content?.trim()) return errorResponse('Content is required');

        const content = body.content.trim().replace(/<[^>]*>/g, '');

        const { data: comment, error } = await supabase
            .from('comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', commentId)
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .single();

        if (error) return errorResponse('Failed to update comment', 500);
        return jsonResponse(comment);
    } catch (error: unknown) {
        console.error('Update comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /comments/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: commentId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { data: existing } = await supabase
            .from('comments')
            .select('author_id, post_id')
            .eq('id', commentId)
            .single();

        if (!existing) return errorResponse('Comment not found', 404);
        if (existing.author_id !== user.id) return errorResponse('Unauthorized', 403);

        await supabase.from('comments').delete().eq('id', commentId);

        // Decrement post comments count
        const { data: post } = await supabase.from('posts').select('comments').eq('id', existing.post_id).single();
        if (post) {
            await supabase.from('posts').update({ comments: Math.max(0, (post.comments || 0) - 1) }).eq('id', existing.post_id);
        }

        return jsonResponse({ message: 'Comment deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}
