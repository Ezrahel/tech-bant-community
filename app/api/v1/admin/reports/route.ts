import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAdmin, paginationParams } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText } from '@/lib/security';
import { validateReportPayload } from '@/lib/validation';

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
        const validation = validateReportPayload(body);
        if (!validation.ok) return errorResponse(validation.error);

        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();
        const { post_id, comment_id, reason } = validation.data;

        let snapshot: Record<string, unknown> | null = null;

        if (post_id) {
            const { data: post } = await supabase
                .from('posts')
                .select('id, title, content, author_id, category, created_at')
                .eq('id', post_id)
                .single();

            if (!post) return errorResponse('Post not found', 404);
            snapshot = { type: 'post', ...post };
        }

        if (comment_id) {
            const { data: comment } = await supabase
                .from('comments')
                .select('id, post_id, content, author_id, created_at')
                .eq('id', comment_id)
                .single();

            if (!comment) return errorResponse('Comment not found', 404);
            snapshot = { type: 'comment', ...comment };
        }

        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                post_id: post_id || null,
                comment_id: comment_id || null,
                reason,
                status: 'pending',
                snapshot,
                created_at: now,
                updated_at: now,
            })
            .select('*')
            .single();

        if (error) return errorResponse('Failed to create report', 500);

        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'report_created',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: JSON.stringify({ report_id: report.id, target_post: post_id || null, target_comment: comment_id || null }),
            created_at: now,
        });

        return jsonResponse(report, 201);
    } catch (error: unknown) {
        console.error('Create report error:', error);
        return errorResponse('Internal server error', 500);
    }
}
