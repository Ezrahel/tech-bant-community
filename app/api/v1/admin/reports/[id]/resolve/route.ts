import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /admin/reports/[id]/resolve - Resolve a report
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: reportId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ status: string }>(req);
        if (!body?.status) return errorResponse('Status is required');

        if (body.status !== 'resolved' && body.status !== 'rejected') {
            return errorResponse("Status must be 'resolved' or 'rejected'", 400);
        }

        const supabase = getSupabaseAdmin();

        const { data: report, error } = await supabase
            .from('reports')
            .update({
                status: body.status,
                resolved_by: user.id,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', reportId)
            .select('*')
            .single();

        if (error || !report) return errorResponse('Failed to resolve report', 500);

        return jsonResponse({ message: 'Report resolved successfully', report });
    } catch (error: unknown) {
        console.error('Resolve report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
