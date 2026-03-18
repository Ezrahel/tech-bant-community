import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PUBLIC_USER_COLUMNS, sanitizeUserContent } from '@/lib/security';

// GET /posts/[id]/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const { limit, offset } = paginationParams(req);
        const supabase = getSupabaseAdmin();

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`*, author:users!author_id(${PUBLIC_USER_COLUMNS})`)
            .eq('post_id', postId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return errorResponse('Failed to fetch comments', 500);

        // Get likes count for each comment
        const commentsWithLikes = await Promise.all(
            (comments || []).map(async (comment) => {
                const { count } = await supabase
                    .from('likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('comment_id', comment.id);
                return { ...comment, likes: count || 0 };
            })
        );

        return jsonResponse(commentsWithLikes);
    } catch (error: unknown) {
        console.error('Get comments error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /posts/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ content: string; parent_id?: string }>(req);
        const content = sanitizeUserContent(body?.content || '');
        if (!content) return errorResponse('Content is required');

        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();

        const { data: comment, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                author_id: user.id,
                parent_id: body?.parent_id || null,
                content,
                created_at: now,
                updated_at: now,
            })
            .select(`*, author:users!author_id(${PUBLIC_USER_COLUMNS})`)
            .single();

        if (error) return errorResponse('Failed to create comment', 500);

        // Increment post comments count
        const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        await supabase
            .from('posts')
            .update({
                comments: commentCount || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        // Update counters
        await supabase.from('counters').upsert(
            { collection_name: 'comments', count: 1, updated_at: now },
            { onConflict: 'collection_name' }
        );

        return jsonResponse({ ...comment, likes: 0 }, 201);
    } catch (error: unknown) {
        console.error('Create comment error:', error);
        return errorResponse('Internal server error', 500);
    }
}
