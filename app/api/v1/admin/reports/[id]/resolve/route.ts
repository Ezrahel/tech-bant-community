import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText } from '@/lib/security';

// POST /admin/reports/[id]/resolve - Resolve a report
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: reportId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const body = await parseBody<{ status: string; admin_notes?: string; resolution_summary?: string; notify_reporter?: boolean }>(req);
        if (!body?.status) return errorResponse('Status is required');

        if (body.status !== 'resolved' && body.status !== 'dismissed') {
            return errorResponse("Status must be 'resolved' or 'dismissed'", 400);
        }

        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();

        const { data: existingReport } = await supabase
            .from('reports')
            .select('id, reporter_id, reason')
            .eq('id', reportId)
            .single();

        if (!existingReport) return errorResponse('Report not found', 404);

        const { data: report, error } = await supabase
            .from('reports')
            .update({
                status: body.status,
                admin_notes: body.admin_notes ? sanitizePlainText(body.admin_notes, 2000) : null,
                resolution_summary: body.resolution_summary ? sanitizePlainText(body.resolution_summary, 2000) : null,
                resolved_by: user.id,
                resolved_at: now,
                updated_at: now,
            })
            .eq('id', reportId)
            .select('*')
            .single();

        if (error || !report) return errorResponse('Failed to resolve report', 500);

        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'report_resolved',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: JSON.stringify({ report_id: reportId, status: body.status, resolution_summary: body.resolution_summary || null }),
            created_at: now,
        });

        if (body.notify_reporter) {
            const { data: reporter } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', existingReport.reporter_id)
                .single();

            if (reporter?.email && process.env.RESEND_API_KEY) {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM || 'noreply@techbantcommunity.com',
                        to: reporter.email,
                        subject: 'Your report has been reviewed',
                        html: `<p>Hello ${reporter.name || 'there'},</p><p>Your report has been ${body.status}.</p><p>${body.resolution_summary || ''}</p>`,
                    }),
                });
            }

            await supabase
                .from('reports')
                .update({ reporter_notified_at: now, updated_at: now })
                .eq('id', reportId);
        }

        return jsonResponse({ message: 'Report resolved successfully', report });
    } catch (error: unknown) {
        console.error('Resolve report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
