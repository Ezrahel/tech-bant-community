import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// PUT /admin/reports/[id] - Update report status (review, resolve, dismiss)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: reportId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ status: string }>(req);
        if (!body?.status) return errorResponse('Status is required');

        const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
        if (!validStatuses.includes(body.status)) {
            return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();

        const { data: report, error } = await supabase
            .from('reports')
            .update({
                status: body.status,
                reviewed_at: now,
                reviewed_by: user.id,
            })
            .eq('id', reportId)
            .select('*')
            .single();

        if (error || !report) return errorResponse('Failed to update report', 500);
        return jsonResponse(report);
    } catch (error: unknown) {
        console.error('Admin update report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
