import { queryOptional } from './db';

export async function incrementPostViews(postID: string): Promise<number | null> {
    const result = await queryOptional<{ views: number }>(
        `
        UPDATE public.posts
        SET views = views + 1
        WHERE id = $1::uuid
        RETURNING views
        `,
        [postID]
    );

    return result?.rows[0]?.views ?? null;
}

export async function syncUserPostsCount(userID: string, updatedAt?: string): Promise<number | null> {
    const result = await queryOptional<{ posts_count: number }>(
        `
        UPDATE public.users AS u
        SET
            posts_count = counts.posts_count,
            updated_at = COALESCE($2::timestamptz, u.updated_at)
        FROM (
            SELECT COUNT(*)::int AS posts_count
            FROM public.posts
            WHERE author_id = $1::uuid
        ) AS counts
        WHERE u.id = $1::uuid
        RETURNING u.posts_count
        `,
        [userID, updatedAt || null]
    );

    return result?.rows[0]?.posts_count ?? null;
}

export async function syncPostCommentsCount(postID: string, updatedAt?: string): Promise<number | null> {
    const result = await queryOptional<{ comments: number }>(
        `
        UPDATE public.posts AS p
        SET
            comments = counts.comments,
            updated_at = COALESCE($2::timestamptz, p.updated_at)
        FROM (
            SELECT COUNT(*)::int AS comments
            FROM public.comments
            WHERE post_id = $1::uuid
        ) AS counts
        WHERE p.id = $1::uuid
        RETURNING p.comments
        `,
        [postID, updatedAt || null]
    );

    return result?.rows[0]?.comments ?? null;
}
