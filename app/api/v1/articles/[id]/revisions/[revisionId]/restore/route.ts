import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

function isAdminOrAbove(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
    try {
        const { id, revisionId } = await params;
        const supabase = getSupabaseAdmin();
        const user = await getUserFromRequest(req);
        if (!user || !isAdminOrAbove(user.role)) return errorResponse('Unauthorized', 401);

        // Get the revision
        const { data: revision, error: revError } = await supabase
            .from('article_revisions')
            .select('*')
            .eq('id', revisionId)
            .eq('article_id', id)
            .single();

        if (revError || !revision) return errorResponse('Revision not found', 404);

        const now = new Date().toISOString();

        // Restore the article from revision
        const { error: updateError } = await supabase
            .from('articles')
            .update({
                title: revision.title,
                content: revision.content,
                html_content: revision.html_content,
                excerpt: revision.excerpt,
                featured_image: revision.featured_image,
                category_id: revision.category_id,
                updated_at: now,
            })
            .eq('id', id);

        if (updateError) return errorResponse('Failed to restore revision', 500);

        // Create a new revision noting the restore
        await supabase.from('article_revisions').insert({
            article_id: id,
            title: revision.title,
            content: revision.content,
            html_content: revision.html_content,
            excerpt: revision.excerpt,
            featured_image: revision.featured_image,
            category_id: revision.category_id,
            editor_id: user.id,
            change_summary: `Restored revision from ${new Date(revision.created_at).toLocaleString()}`,
            created_at: now,
        });

        const { data: article } = await supabase
            .from('articles')
            .select('*, author:author_id(id, name, email, avatar, role), category:category_id(id, name, slug)')
            .eq('id', id)
            .single();

        return jsonResponse(article);
    } catch (error: unknown) {
        console.error('Restore revision error:', error);
        return errorResponse('Internal server error', 500);
    }
}
