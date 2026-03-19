import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { syncPostCommentsCount } from '@/lib/counters';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PUBLIC_USER_COLUMNS, sanitizeUserContent } from '@/lib/security';

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
        const content = sanitizeUserContent(body?.content || '');
        if (!content) return errorResponse('Content is required');

        const { data: comment, error } = await supabase
            .from('comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', commentId)
            .select(`*, author:users!author_id(${PUBLIC_USER_COLUMNS})`)
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

        const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);
        if (deleteError) return errorResponse('Failed to delete comment', 500);

        const syncedCommentsCount = await syncPostCommentsCount(existing.post_id);
        if (syncedCommentsCount === null) {
            const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', existing.post_id);

            await supabase
                .from('posts')
                .update({ comments: count || 0 })
                .eq('id', existing.post_id);
        }

        return jsonResponse({ message: 'Comment deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}
