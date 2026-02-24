import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user: authUser } = authResult;

        const supabase = getSupabaseAdmin();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !user) return errorResponse('User not found', 404);

        return jsonResponse({ user });
    } catch (error: unknown) {
        console.error('Verify error:', error);
        return errorResponse('Internal server error', 500);
    }
}
