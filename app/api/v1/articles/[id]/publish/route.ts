import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: article, error: fetchError } = await supabase
            .from('articles')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !article) return errorResponse('Article not found', 404);

        const now = new Date().toISOString();
        const newStatus = article.status === 'published' ? 'draft' : 'published';

        const { error } = await supabase
            .from('articles')
            .update({
                status: newStatus,
                published_at: newStatus === 'published' ? now : null,
                updated_at: now,
            })
            .eq('id', id);

        if (error) return errorResponse('Failed to toggle publish status', 500);

        return jsonResponse({
            message: newStatus === 'published' ? 'Article published' : 'Article unpublished',
            status: newStatus,
        });
    } catch (error: unknown) {
        console.error('Publish toggle error:', error);
        return errorResponse('Internal server error', 500);
    }
}
