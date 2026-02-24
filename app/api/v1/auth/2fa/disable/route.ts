import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();
        await supabase
            .from('two_factor_auth')
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

        return jsonResponse({ message: '2FA disabled successfully' });
    } catch (error: unknown) {
        console.error('Disable 2FA error:', error);
        return errorResponse('Internal server error', 500);
    }
}
