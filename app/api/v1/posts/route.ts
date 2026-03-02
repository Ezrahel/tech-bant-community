import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, paginationParams, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

// GET /posts - List posts (with optional category filter)
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { limit, offset } = paginationParams(req);
        const url = new URL(req.url);
        const category = url.searchParams.get('category');

        let query = supabase
            .from('posts')
            .select(`
                *,
                author:users!author_id(id, name, email, avatar, is_admin, is_verified),
                media:media(id, type, url, name, size)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data: posts, error } = await query;
        if (error) {
            console.error('Supabase fetch posts error:', error);
            return errorResponse('Failed to fetch posts', 500);
        }

        // Check for likes/bookmarks if user is authenticated
        const user = await getUserFromRequest(req);
        let postsWithStatus = posts || [];

        if (user && posts && posts.length > 0) {
            const postIds = posts.map(p => p.id);

            const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
                supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
                supabase.from('bookmarks').select('post_id').in('post_id', postIds).eq('user_id', user.id)
            ]);

            const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
            const bookmarkedPostIds = new Set(userBookmarks?.map(b => b.post_id) || []);

            postsWithStatus = posts.map(post => ({
                ...post,
                is_liked: likedPostIds.has(post.id),
                is_bookmarked: bookmarkedPostIds.has(post.id)
            }));
        }

        return jsonResponse(postsWithStatus);
    } catch (error: unknown) {
        console.error('Get posts error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /posts - Create a new post
export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{
            title: string;
            content: string;
            category: string;
            tags?: string[];
            location?: string;
            mediaIds?: string[];
        }>(req);
        if (!body) return errorResponse('Invalid request body');

        const { title, content, category, tags, location, mediaIds } = body;
        if (!title?.trim()) return errorResponse('Title is required');
        if (!content?.trim()) return errorResponse('Content is required');
        if (!category?.trim()) return errorResponse('Category is required');

        const supabase = getSupabaseAdmin();

        // Check for duplicate
        const contentHash = createHash('sha256')
            .update(`${user.id}:${title}:${content}`)
            .digest('hex');

        const { data: existing } = await supabase
            .from('posts')
            .select('id')
            .eq('author_id', user.id)
            .eq('content_hash', contentHash)
            .limit(1)
            .single();

        if (existing) return errorResponse('Duplicate post detected', 409);

        const now = new Date().toISOString();

        // Insert post
        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                title,
                content,
                author_id: user.id,
                category,
                tags: tags || [],
                likes: 0,
                comments: 0,
                views: 0,
                shares: 0,
                is_pinned: false,
                is_hot: false,
                location: location || null,
                content_hash: contentHash,
                published_at: now,
                created_at: now,
                updated_at: now,
            })
            .select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)')
            .single();

        if (error) return errorResponse('Failed to create post', 500);

        // Link media if provided
        if (mediaIds && mediaIds.length > 0) {
            const { error: mediaError } = await supabase
                .from('media')
                .update({ post_id: post.id })
                .in('id', mediaIds)
                .eq('user_id', user.id);

            if (mediaError) {
                console.error('Failed to link media:', mediaError);
                // We don't fail the whole post creation if media linking fails, 
                // but we should probably log it.
            }
        }

        // Increment user posts count
        const { data: authorProfile } = await supabase
            .from('users')
            .select('posts_count')
            .eq('id', user.id)
            .single();

        await supabase
            .from('users')
            .update({
                posts_count: (authorProfile?.posts_count || 0) + 1,
                updated_at: now,
            })
            .eq('id', user.id);

        return jsonResponse(post, 201);
    } catch (error: unknown) {
        console.error('Create post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
