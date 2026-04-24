import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth, paginationParams, getUserFromRequest } from '@/lib/api-helpers';
import { syncUserPostsCount } from '@/lib/counters';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';
import { PUBLIC_USER_COLUMNS, sanitizePlainText, sanitizeUserContent } from '@/lib/security';
import { samplePosts } from '@/src/data/sampleData';

function isMissingPostsTableError(error: { code?: string; message?: string } | null | undefined) {
    return error?.code === 'PGRST205' && error.message?.includes("table 'public.posts'");
}

function buildSamplePostResponse() {
    return samplePosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author_id: post.author.id,
        author: {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
            avatar: post.author.avatar,
            is_admin: post.author.isAdmin,
            is_verified: post.author.isVerified,
            role: post.author.role || (post.author.isAdmin ? 'admin' : 'user'),
            provider: post.author.provider || 'sample',
            bio: post.author.bio || null,
            location: post.author.location || null,
            website: post.author.website || null,
            posts_count: 0,
            followers_count: 0,
            following_count: 0,
            created_at: post.author.createdAt || new Date().toISOString(),
            updated_at: post.author.updatedAt || new Date().toISOString(),
        },
        category: post.category,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
        shares: post.shares,
        is_pinned: post.isPinned || false,
        is_hot: post.isHot || false,
        is_liked: post.isLiked || false,
        is_bookmarked: post.isBookmarked || false,
        media: (post.media || []).map((item) => ({
            id: item.id,
            type: item.type,
            url: item.url,
            name: item.name,
            size: item.size,
        })),
        location: null,
        published_at: post.publishedAt,
        created_at: post.publishedAt,
        updated_at: post.publishedAt,
    }));
}

// GET /posts - List posts (with optional category filter)
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { limit, offset } = paginationParams(req);
        const url = new URL(req.url);
        const category = url.searchParams.get('category');

        let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data: postsData, error } = await query;
        if (error) {
            if (isMissingPostsTableError(error)) {
                console.warn('Falling back to sample posts because public.posts is missing from Supabase schema cache.');
                const fallbackPosts = buildSamplePostResponse();
                return jsonResponse(
                    category ? fallbackPosts.filter((post) => post.category === category) : fallbackPosts
                );
            }
            console.error('Supabase fetch posts error:', error);
            return errorResponse('Failed to fetch posts', 500);
        }

        const posts = postsData || [];
        const authorIDs = Array.from(new Set(posts.map((post) => post.author_id).filter(Boolean)));
        const postIDs = posts.map((post) => post.id);

        const [{ data: authors, error: authorsError }, { data: media, error: mediaError }] = await Promise.all([
            authorIDs.length > 0
                ? supabase.from('users').select(PUBLIC_USER_COLUMNS).in('id', authorIDs)
                : Promise.resolve({ data: [], error: null }),
            postIDs.length > 0
                ? supabase.from('media').select('id, post_id, type, url, name, size').in('post_id', postIDs)
                : Promise.resolve({ data: [], error: null }),
        ]);

        if (authorsError) {
            console.error('Supabase fetch post authors error:', authorsError);
            return errorResponse('Failed to fetch posts', 500);
        }

        if (mediaError) {
            console.error('Supabase fetch post media error:', mediaError);
            return errorResponse('Failed to fetch posts', 500);
        }

        const authorsByID = new Map((authors || []).map((author) => [author.id, author]));
        const mediaByPostID = new Map<string, Array<{
            id: string;
            type: string;
            url: string;
            name: string | null;
            size: number | null;
        }>>();

        for (const item of media || []) {
            if (!item.post_id) continue;
            const existing = mediaByPostID.get(item.post_id) || [];
            existing.push({
                id: item.id,
                type: item.type,
                url: item.url,
                name: item.name,
                size: item.size,
            });
            mediaByPostID.set(item.post_id, existing);
        }

        const hydratedPosts = posts.map((post) => ({
            ...post,
            author: authorsByID.get(post.author_id) || {
                id: post.author_id,
                name: 'Unknown user',
                avatar: '',
                bio: null,
                location: null,
                website: null,
                is_admin: false,
                is_verified: false,
                role: 'user',
                provider: 'email',
                posts_count: 0,
                followers_count: 0,
                following_count: 0,
                created_at: post.created_at,
                updated_at: post.updated_at,
            },
            media: mediaByPostID.get(post.id) || [],
        }));

        // Check for likes/bookmarks if user is authenticated
        const user = await getUserFromRequest(req);
        let postsWithStatus = hydratedPosts;

        if (user && hydratedPosts.length > 0) {
            const postIds = hydratedPosts.map((p) => p.id);

            const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
                supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
                supabase.from('bookmarks').select('post_id').in('post_id', postIds).eq('user_id', user.id)
            ]);

            const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
            const bookmarkedPostIds = new Set(userBookmarks?.map(b => b.post_id) || []);

            postsWithStatus = hydratedPosts.map(post => ({
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

        const title = sanitizePlainText(body.title || '', 200);
        const content = sanitizeUserContent(body.content || '');
        const category = sanitizePlainText(body.category || '', 50);
        const tags = (body.tags || [])
            .map((tag) => sanitizePlainText(tag, 50))
            .filter(Boolean)
            .slice(0, 10);
        const location = body.location ? sanitizePlainText(body.location, 100) : null;
        const mediaIDs = body.mediaIds || [];

        if (!title) return errorResponse('Title is required');
        if (!content) return errorResponse('Content is required');
        if (!category) return errorResponse('Category is required');

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
                tags,
                likes: 0,
                comments: 0,
                views: 0,
                shares: 0,
                is_pinned: false,
                is_hot: false,
                location,
                content_hash: contentHash,
                published_at: now,
                created_at: now,
                updated_at: now,
            })
            .select(`*, author:users!author_id(${PUBLIC_USER_COLUMNS})`)
            .single();

        if (error) return errorResponse('Failed to create post', 500);

        // Link media if provided
        if (mediaIDs.length > 0) {
            const { error: mediaError } = await supabase
                .from('media')
                .update({ post_id: post.id })
                .in('id', mediaIDs)
                .eq('user_id', user.id);

            if (mediaError) {
                console.error('Failed to link media:', mediaError);
                // We don't fail the whole post creation if media linking fails, 
                // but we should probably log it.
            }
        }

        const syncedPostsCount = await syncUserPostsCount(user.id, now);
        if (syncedPostsCount === null) {
            const { count } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', user.id);

            await supabase
                .from('users')
                .update({
                    posts_count: count || 0,
                    updated_at: now,
                })
                .eq('id', user.id);
        }

        return jsonResponse(post, 201);
    } catch (error: unknown) {
        console.error('Create post error:', error);
        return errorResponse('Internal server error', 500);
    }
}
