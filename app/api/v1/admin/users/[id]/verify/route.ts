import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /admin/users/[id]/verify - Verify a user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetId } = await params;
        const authResult = await withAdmin(req);
        if (authResult instanceof Response) return authResult;

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('users')
            .update({
                is_verified: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', targetId);

        if (error) return errorResponse('Failed to verify user', 500);

        return jsonResponse({ message: 'User verified successfully' });
    } catch (error: unknown) {
        console.error('Verify user error:', error);
        return errorResponse('Internal server error', 500);
    }
}
