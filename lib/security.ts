import { randomInt, createHash } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

export const PUBLIC_USER_COLUMNS = `
    id,
    name,
    avatar,
    bio,
    location,
    website,
    is_admin,
    is_verified,
    role,
    provider,
    posts_count,
    followers_count,
    following_count,
    created_at,
    updated_at
`;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);

const FILE_EXTENSION_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
};

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function sanitizePlainText(input: string, maxLength?: number): string {
    const sanitized = input
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (maxLength === undefined) {
        return sanitized;
    }

    return sanitized.slice(0, maxLength);
}

export function sanitizeUserContent(input: string): string {
    return input
        .replace(/<[^>]*>/g, '')
        .replace(/\r\n/g, '\n')
        .trim();
}

export function sanitizeSearchQuery(input: string): string {
    return input
        .replace(/[%_*(),]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function validateWebsiteURL(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    let url: URL;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
    }
    if (url.username || url.password) {
        return null;
    }

    return url.toString();
}

export function validateAvatarURL(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    let url: URL;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }

    if (url.protocol !== 'https:') {
        return null;
    }
    if (url.username || url.password) {
        return null;
    }

    return url.toString();
}

export function getUploadConstraints(mimeType: string): { mediaType: 'image' | 'video'; maxBytes: number } | null {
    if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        return { mediaType: 'image', maxBytes: MAX_IMAGE_UPLOAD_BYTES };
    }
    if (ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
        return { mediaType: 'video', maxBytes: MAX_VIDEO_UPLOAD_BYTES };
    }

    return null;
}

export function buildSafeObjectPath(mediaID: string, mimeType: string): string {
    const extension = FILE_EXTENSION_BY_MIME[mimeType];
    if (!extension) {
        throw new Error('Unsupported file type');
    }

    return `${mediaID}/upload.${extension}`;
}

export async function issueEmailOTP(
    supabase: SupabaseClient,
    params: {
        userID: string;
        email: string;
        type: '2fa' | 'password_reset';
        resendAPIKey?: string;
        resendFrom?: string;
        subject: string;
        html: (code: string) => string;
    }
): Promise<void> {
    const code = String(randomInt(100000, 999999));
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashedCode = createHash('sha256').update(code).digest('hex');

    await supabase
        .from('otps')
        .update({ used: true })
        .eq('user_id', params.userID)
        .eq('type', params.type)
        .eq('used', false);

    await supabase.from('otps').insert({
        user_id: params.userID,
        email: params.email,
        code: hashedCode,
        type: params.type,
        expires_at: expiresAt,
        used: false,
        attempts: 0,
        created_at: now,
    });

    if (!params.resendAPIKey) {
        return;
    }

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${params.resendAPIKey}`,
        },
        body: JSON.stringify({
            from: params.resendFrom || 'noreply@techbantcommunity.com',
            to: params.email,
            subject: params.subject,
            html: params.html(code),
        }),
    });
}

export async function verifyOTPCode(
    supabase: SupabaseClient,
    params: {
        userID: string;
        email: string;
        type: '2fa' | 'password_reset';
        code: string;
    }
): Promise<{ ok: true } | { ok: false; reason: string }> {
    const { data: otp } = await supabase
        .from('otps')
        .select('*')
        .eq('user_id', params.userID)
        .eq('email', params.email)
        .eq('type', params.type)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!otp) {
        return { ok: false, reason: 'Invalid or expired code' };
    }

    if (new Date(otp.expires_at) < new Date()) {
        await supabase.from('otps').update({ used: true }).eq('id', otp.id);
        return { ok: false, reason: 'Code expired' };
    }

    if ((otp.attempts || 0) >= 5) {
        await supabase.from('otps').update({ used: true }).eq('id', otp.id);
        return { ok: false, reason: 'Too many attempts' };
    }

    const hashedInput = createHash('sha256').update(params.code).digest('hex');
    if (hashedInput !== otp.code) {
        await supabase
            .from('otps')
            .update({ attempts: (otp.attempts || 0) + 1 })
            .eq('id', otp.id);
        return { ok: false, reason: 'Invalid code' };
    }

    await supabase.from('otps').update({ used: true }).eq('id', otp.id);
    return { ok: true };
}
