import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey, getStorageBucket } from '@/lib/supabase';

// DELETE /media/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: mediaId } = await params;
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const supabase = getSupabaseAdmin();

        const { data: media } = await supabase
            .from('media')
            .select('*')
            .eq('id', mediaId)
            .single();

        if (!media) return errorResponse('Media not found', 404);
        if (media.user_id !== user.id) return errorResponse('Unauthorized', 403);

        // Delete from storage
        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();
        const bucket = getStorageBucket();

        const prefix = `${supabaseURL}/storage/v1/object/public/${bucket}/`;
        const filePath = media.url.startsWith(prefix) ? media.url.slice(prefix.length) : '';

        if (filePath) {
            await fetch(`${supabaseURL}/storage/v1/object/${bucket}/${filePath}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${serviceKey}` },
            }).catch(() => { }); // Best effort
        }

        // Delete record
        await supabase.from('media').delete().eq('id', mediaId);

        return jsonResponse({ message: 'Media deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete media error:', error);
        return errorResponse('Internal server error', 500);
    }
}
