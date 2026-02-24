import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /admin/reports
export async function GET(req: NextRequest) {
    try {
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const { limit, offset } = paginationParams(req);
        const url = new URL(req.url);
        const status = url.searchParams.get('status') || '';

        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('reports')
            .select('*, reporter:users!reporter_id(id, name, email, avatar)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);

        const { data: reports, error } = await query;
        if (error) return errorResponse('Failed to fetch reports', 500);

        return jsonResponse(reports || []);
    } catch (error: unknown) {
        console.error('Admin reports error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /admin/reports - Create a report
export async function POST(req: NextRequest) {
    try {
        // Reports can be created by any authenticated user
        const { withAuth } = await import('@/lib/api-helpers');
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ post_id?: string; comment_id?: string; reason: string }>(req);
        if (!body?.reason) return errorResponse('Reason is required');
        if (!body.post_id && !body.comment_id) return errorResponse('Post or comment ID is required');

        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();

        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                post_id: body.post_id || null,
                comment_id: body.comment_id || null,
                reason: body.reason,
                status: 'pending',
                created_at: now,
            })
            .select('*')
            .single();

        if (error) return errorResponse('Failed to create report', 500);
        return jsonResponse(report, 201);
    } catch (error: unknown) {
        console.error('Create report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
