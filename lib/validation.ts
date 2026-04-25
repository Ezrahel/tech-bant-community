import { normalizeEmail, sanitizePlainText } from './security';

type ValidationSuccess<T> = { ok: true; data: T };
type ValidationFailure = { ok: false; error: string };

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateLoginPayload(body: { email?: string; password?: string; otpCode?: string } | null): ValidationResult<{ email: string; password: string; otpCode?: string }> {
    if (!body) return { ok: false, error: 'Invalid request body' };

    const email = normalizeEmail(body.email || '');
    if (!email || !email.includes('@')) return { ok: false, error: 'Valid email is required' };

    const password = body.password?.trim() || '';
    if (!password) return { ok: false, error: 'Password is required' };

    const otpCode = body.otpCode?.trim();
    if (otpCode && !/^\d{6}$/.test(otpCode)) return { ok: false, error: 'OTP code must be 6 digits' };

    return { ok: true, data: { email, password, otpCode } };
}

export function validateSignupPayload(body: { email?: string; password?: string; name?: string } | null): ValidationResult<{ email: string; password: string; name: string }> {
    if (!body) return { ok: false, error: 'Invalid request body' };

    const email = normalizeEmail(body.email || '');
    if (!email || !email.includes('@')) return { ok: false, error: 'Valid email is required' };

    const password = body.password || '';
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };

    const name = sanitizePlainText(body.name || '', 100);
    if (!name) return { ok: false, error: 'Name is required' };

    return { ok: true, data: { email, password, name } };
}

export function validateAdminCreationPayload(
    body: { email?: string; password?: string; name?: string; role?: string } | null
): ValidationResult<{ email: string; password: string; name: string; role: 'admin' | 'super_admin' }> {
    if (!body) return { ok: false, error: 'Invalid request body' };

    const baseValidation = validateSignupPayload(body);
    if (!baseValidation.ok) return baseValidation;

    const role = body.role || 'admin';
    if (role !== 'admin' && role !== 'super_admin') {
        return { ok: false, error: 'Invalid role' };
    }

    return {
        ok: true,
        data: {
            ...baseValidation.data,
            role,
        },
    };
}

export function validateAdminBootstrapPayload(
    body: { email?: string; password?: string; name?: string; secret?: string } | null
): ValidationResult<{ email: string; password: string; name: string; secret: string }> {
    if (!body) return { ok: false, error: 'Invalid request body' };

    const baseValidation = validateSignupPayload(body);
    if (!baseValidation.ok) return baseValidation;

    const secret = body.secret?.trim() || '';
    if (!secret) {
        return { ok: false, error: 'Bootstrap secret is required' };
    }

    return {
        ok: true,
        data: {
            ...baseValidation.data,
            secret,
        },
    };
}

export function validateReportPayload(body: { post_id?: string; comment_id?: string; reason?: string } | null): ValidationResult<{ post_id?: string; comment_id?: string; reason: string }> {
    if (!body) return { ok: false, error: 'Invalid request body' };

    const reason = sanitizePlainText(body.reason || '', 1000);
    if (!reason) return { ok: false, error: 'Reason is required' };
    if (!body.post_id && !body.comment_id) return { ok: false, error: 'Post or comment ID is required' };
    if (body.post_id && body.comment_id) return { ok: false, error: 'Only one report target can be submitted at a time' };

    return {
        ok: true,
        data: {
            post_id: body.post_id,
            comment_id: body.comment_id,
            reason,
        },
    };
}
