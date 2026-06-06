import { SupabaseClient } from '@supabase/supabase-js';

export async function syncUserPostsCountWithSupabase(
    supabase: SupabaseClient,
    userID: string,
    updatedAt?: string
): Promise<number> {
    const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userID);

    if (countError) {
        console.error('syncUserPostsCountWithSupabase count error:', countError);
        throw countError;
    }

    const postsCount = count ?? 0;
    const updates: Record<string, unknown> = { posts_count: postsCount };
    if (updatedAt) {
        updates.updated_at = updatedAt;
    }

    const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userID);

    if (updateError) {
        console.error('syncUserPostsCountWithSupabase update error:', updateError);
        throw updateError;
    }

    return postsCount;
}
