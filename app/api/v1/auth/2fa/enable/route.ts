import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();
        await supabase.from('two_factor_auth').upsert({
            user_id: user.id,
            enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        return jsonResponse({ message: '2FA enabled successfully' });
    } catch (error: unknown) {
        console.error('Enable 2FA error:', error);
        return errorResponse('Internal server error', 500);
    }
}
