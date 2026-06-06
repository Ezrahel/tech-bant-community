import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, getUserFromRequest } from '@/lib/api-helpers';
import { incrementPostViews, syncUserPostsCount } from '@/lib/counters';
import { fetchPostById, hydratePost } from '@/lib/posts';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PUBLIC_USER_COLUMNS, sanitizePlainText, sanitizeUserContent } from '@/lib/security';
import { samplePosts } from '@/src/data/sampleData';

function isMissingPostsTableError(error: { code?: string; message?: string } | null | undefined) {
    return error?.code === 'PGRST205' || error?.code === '42P01' || error?.message?.includes('relation') === true;
}

// GET /posts/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { post, error } = await fetchPostById(supabase, id);

        if (error || !post) {
            if (isMissingPostsTableError(error)) {
                const samplePost = samplePosts.find((item) => item.id === id);
                if (!samplePost) return errorResponse('Post not found', 404);

                return jsonResponse({
                    id: samplePost.id,
                    title: samplePost.title,
                    content: samplePost.content,
                    author_id: samplePost.author.id,
                    author: {
                        id: samplePost.author.id,
                        name: samplePost.author.name,
                        email: samplePost.author.email,
                        avatar: samplePost.author.avatar,
                        is_admin: samplePost.author.isAdmin,
                        is_verified: samplePost.author.isVerified,
                    },
                    category: samplePost.category,
                    tags: samplePost.tags,
                    likes: samplePost.likes,
                    comments: samplePost.comments,
                    views: samplePost.views,
                    shares: samplePost.shares,
                    is_pinned: samplePost.isPinned || false,
                    is_hot: samplePost.isHot || false,
                    is_liked: samplePost.isLiked || false,
                    is_bookmarked: samplePost.isBookmarked || false,
                    media: samplePost.media || [],
                    location: null,
                    published_at: samplePost.publishedAt,
                    created_at: samplePost.publishedAt,
                    updated_at: samplePost.publishedAt,
                });
            }
            return errorResponse('Post not found', 404);
        }

        let isLiked = false;
        let isBookmarked = false;

        const user = await getUserFromRequest(req);
        if (user) {
            const [{ data: like }, { data: bookmark }] = await Promise.all([
                supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
                supabase.from('bookmarks').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
            ]);
            isLiked = !!like;
            isBookmarked = !!bookmark;
        }

        const currentViews = typeof post.views === 'number' ? post.views : 0;
        const incrementedViews = await incrementPostViews(id);

        if (incrementedViews === null) {
            await supabase
                .from('posts')
                .update({
                    views: currentViews + 1,
                    updated_at: post.updated_at as string,
                })
                .eq('id', id);
        }

        return jsonResponse({
            ...post,
            is_liked: isLiked,
            is_bookmarked: isBookmarked,
            views: incrementedViews ?? (currentViews + 1),
        });
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
            html_content?: string;
            category?: string;
            tags?: string[];
            location?: string;
        }>(req);
        if (!body) return errorResponse('Invalid request body');

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.title !== undefined) {
            const title = sanitizePlainText(body.title, 200);
            if (!title) return errorResponse('Title is required');
            updates.title = title;
        }
        if (body.content !== undefined) {
            const content = sanitizeUserContent(body.content);
            if (!content) return errorResponse('Content is required');
            updates.content = content;
        }
        if (body.html_content !== undefined) {
            updates.html_content = body.html_content?.trim() || null;
        }
        if (body.category !== undefined) {
            const category = sanitizePlainText(body.category, 50);
            if (!category) return errorResponse('Category is required');
            updates.category = category;
        }
        if (body.tags) {
            updates.tags = body.tags
                .map((tag) => sanitizePlainText(tag, 50))
                .filter(Boolean)
                .slice(0, 10);
        }
        if (body.location !== undefined) {
            updates.location = body.location ? sanitizePlainText(body.location, 100) : null;
        }

        const { data: updatedPost, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !updatedPost) return errorResponse('Failed to update post', 500);

        const hydratedPost = await hydratePost(supabase, updatedPost);
        return jsonResponse(hydratedPost);
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

        const { data: existing } = await supabase
            .from('posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) return errorResponse('Post not found', 404);
        if (existing.author_id !== user.id) return errorResponse('Unauthorized', 403);

        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) return errorResponse('Failed to delete post', 500);

        const syncedPostsCount = await syncUserPostsCount(user.id);
        if (syncedPostsCount === null) {
            const { count } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', user.id);

            await supabase
                .from('users')
                .update({ posts_count: count || 0 })
                .eq('id', user.id);
        }

        return jsonResponse({ message: 'Post deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
