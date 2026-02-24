import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey, getStorageBucket } from '@/lib/supabase';

// POST /media/upload
export async function POST(req: NextRequest) {
    try {
        const authResult = await withAuth(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return errorResponse('File is required');

        const supabase = getSupabaseAdmin();
        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();
        const bucket = getStorageBucket();

        // Determine media type
        let mediaType = 'image';
        if (file.type.startsWith('video')) mediaType = 'video';

        // Generate unique path
        const mediaId = crypto.randomUUID();
        const objectPath = `${mediaId}/${file.name}`;

        // Upload to Supabase Storage via HTTP
        const fileBuffer = await file.arrayBuffer();
        const uploadResp = await fetch(`${supabaseURL}/storage/v1/object/${bucket}/${objectPath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': file.type,
                'x-upsert': 'false',
            },
            body: fileBuffer,
        });

        if (!uploadResp.ok) {
            const errBody = await uploadResp.text();
            return errorResponse(`Upload failed: ${errBody}`, 500);
        }

        const publicURL = `${supabaseURL}/storage/v1/object/public/${bucket}/${objectPath}`;
        const now = new Date().toISOString();

        // Create media record
        const { data: media, error } = await supabase
            .from('media')
            .insert({
                id: mediaId,
                user_id: user.id,
                url: publicURL,
                type: mediaType,
                size: file.size,
                created_at: now,
            })
            .select('*')
            .single();

        if (error) {
            // Rollback: delete from storage
            await fetch(`${supabaseURL}/storage/v1/object/${bucket}/${objectPath}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${serviceKey}` },
            });
            return errorResponse('Failed to create media record', 500);
        }

        return jsonResponse({
            id: media.id,
            type: media.type,
            url: media.url,
            name: file.name,
            size: media.size,
        }, 201);
    } catch (error: unknown) {
        console.error('Upload error:', error);
        return errorResponse('Internal server error', 500);
    }
}
