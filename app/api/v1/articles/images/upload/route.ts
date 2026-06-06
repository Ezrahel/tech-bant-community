import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin, getSupabaseURL, getSupabaseServiceKey, getStorageBucket, ensureStorageBucket } from '@/lib/supabase';

function isAdminOrAbove(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || !isAdminOrAbove(user.role)) return errorResponse('Unauthorized', 401);

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const articleId = formData.get('article_id') as string | null;

        if (!file) return errorResponse('File is required');
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            return errorResponse('Unsupported image type. Supported: JPEG, PNG, WebP, GIF, AVIF', 415);
        }
        if (file.size > MAX_IMAGE_SIZE) {
            return errorResponse('Image exceeds maximum size of 10MB', 413);
        }

        const supabase = getSupabaseAdmin();
        const supabaseURL = getSupabaseURL();
        const serviceKey = getSupabaseServiceKey();
        const bucket = getStorageBucket();

        await ensureStorageBucket(bucket);

        const imageId = crypto.randomUUID();
        const ext = file.name.split('.').pop() || 'jpg';
        const objectPath = `articles/${imageId}.${ext}`;

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

        // Create article image record
        const { data: image, error } = await supabase
            .from('article_images')
            .insert({
                id: imageId,
                article_id: articleId || null,
                url: publicURL,
                alt: file.name,
                file_size: file.size,
                uploaded_by: user.id,
                created_at: new Date().toISOString(),
            })
            .select('*')
            .single();

        if (error) {
            await fetch(`${supabaseURL}/storage/v1/object/${bucket}/${objectPath}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${serviceKey}` },
            });
            return errorResponse('Failed to create image record', 500);
        }

        return jsonResponse(image, 201);
    } catch (error: unknown) {
        console.error('Article image upload error:', error);
        return errorResponse('Internal server error', 500);
    }
}
