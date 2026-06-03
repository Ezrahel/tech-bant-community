import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: revisions, error } = await supabase
            .from('article_revisions')
            .select('*, editor:editor_id(id, name, email, avatar)')
            .eq('article_id', id)
            .order('created_at', { ascending: false });

        if (error) return errorResponse('Failed to fetch revisions', 500);

        return jsonResponse(revisions || []);
    } catch (error: unknown) {
        console.error('Get revisions error:', error);
        return errorResponse('Internal server error', 500);
    }
}
