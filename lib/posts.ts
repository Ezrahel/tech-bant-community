import { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_USER_COLUMNS } from './security';

type PostRow = Record<string, unknown> & {
    id: string;
    author_id: string;
    views?: number;
    created_at: string;
    updated_at: string;
};

type AuthorRow = Record<string, unknown> & {
    id: string;
    name?: string;
};

type MediaRow = {
    id: string;
    type: string;
    url: string;
    name: string | null;
    size: number | null;
};

function buildFallbackAuthor(post: PostRow): AuthorRow {
    return {
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
    };
}

export async function hydratePost(
    supabase: SupabaseClient,
    post: PostRow,
    options: { includeMedia?: boolean } = {}
): Promise<Record<string, unknown>> {
    const includeMedia = options.includeMedia !== false;

    const [{ data: author, error: authorError }, mediaResult] = await Promise.all([
        supabase
            .from('users')
            .select(PUBLIC_USER_COLUMNS)
            .eq('id', post.author_id)
            .maybeSingle(),
        includeMedia
            ? supabase
                .from('media')
                .select('id, type, url, name, size')
                .eq('post_id', post.id)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (authorError) {
        console.error('hydratePost: author fetch error:', authorError);
    }

    if (mediaResult.error) {
        console.error('hydratePost: media fetch error:', mediaResult.error);
    }

    return {
        ...post,
        author: author || buildFallbackAuthor(post),
        media: (mediaResult.data || []) as MediaRow[],
    };
}

export async function fetchPostById(
    supabase: SupabaseClient,
    id: string
): Promise<{ post: Record<string, unknown> | null; error: { code?: string; message?: string } | null }> {
    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error || !post) {
        return { post: null, error };
    }

    const hydratedPost = await hydratePost(supabase, post as PostRow);
    return { post: hydratedPost, error: null };
}
