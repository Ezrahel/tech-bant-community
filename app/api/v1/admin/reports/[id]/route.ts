import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText } from '@/lib/security';

// PUT /admin/reports/[id] - Update report status (review, resolve, dismiss)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: reportId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ status: string; admin_notes?: string; resolution_summary?: string }>(req);
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
                admin_notes: body.admin_notes ? sanitizePlainText(body.admin_notes, 2000) : null,
                resolution_summary: body.resolution_summary ? sanitizePlainText(body.resolution_summary, 2000) : null,
                reviewed_at: now,
                reviewed_by: user.id,
                updated_at: now,
            })
            .eq('id', reportId)
            .select('*')
            .single();

        if (error || !report) return errorResponse('Failed to update report', 500);

        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'report_status_updated',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: JSON.stringify({ report_id: reportId, status: body.status }),
            created_at: now,
        });

        return jsonResponse(report);
    } catch (error: unknown) {
        console.error('Admin update report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
