import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody } from '@/lib/api-helpers';
import { bootstrapSuperAdminUser, countSuperAdmins } from '@/lib/admin-users';
import { validateAdminBootstrapPayload } from '@/lib/validation';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const bootstrapSecret = process.env.SUPERADMIN_BOOTSTRAP_SECRET?.trim();
        if (!bootstrapSecret) {
            return errorResponse('Superadmin bootstrap is not configured', 503);
        }

        const body = await parseBody<{ name?: string; email?: string; password?: string; secret?: string }>(req);
        const validation = validateAdminBootstrapPayload(body);
        if (!validation.ok) return errorResponse(validation.error);

        if (validation.data.secret !== bootstrapSecret) {
            return errorResponse('Invalid bootstrap secret', 403);
        }

        const superAdminCount = await countSuperAdmins();
        if (superAdminCount > 0) {
            return errorResponse('A superadmin already exists. Use the authenticated admin routes instead.', 409);
        }

        const user = await bootstrapSuperAdminUser({
            name: validation.data.name,
            email: validation.data.email,
            password: validation.data.password,
        });

        await getSupabaseAdmin().from('security_events').insert({
            user_id: user.id,
            event_type: 'superadmin_bootstrap',
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            success: true,
            details: 'Initial superadmin bootstrapped through Next backend',
            created_at: new Date().toISOString(),
        });

        return jsonResponse({
            message: 'Superadmin bootstrapped successfully',
            user,
        }, 201);
    } catch (error: unknown) {
        console.error('Superadmin bootstrap error:', error);
        return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
    }
}
