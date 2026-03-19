module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStorageBucket",
    ()=>getStorageBucket,
    "getSupabaseAdmin",
    ()=>getSupabaseAdmin,
    "getSupabaseAnon",
    ()=>getSupabaseAnon,
    "getSupabaseAnonKey",
    ()=>getSupabaseAnonKey,
    "getSupabaseServiceKey",
    ()=>getSupabaseServiceKey,
    "getSupabaseURL",
    ()=>getSupabaseURL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
// Server-side admin client (uses service role key - full access, bypasses RLS)
let adminClient = null;
function getSupabaseAdmin() {
    if (!adminClient) {
        const url = ("TURBOPACK compile-time value", "https://pwaoarutecglttcuqyen.supabase.co");
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }
        adminClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return adminClient;
}
// Server-side anon client (for Supabase Auth signup/login calls)
let anonClient = null;
function getSupabaseAnon() {
    if (!anonClient) {
        const url = ("TURBOPACK compile-time value", "https://pwaoarutecglttcuqyen.supabase.co");
        const anonKey = ("TURBOPACK compile-time value", "sb_publishable_ru9zRYWtaZ0jyhQoKS3aEA_tWKWx6LQ");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        anonClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, anonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return anonClient;
}
function getSupabaseURL() {
    return "TURBOPACK compile-time value", "https://pwaoarutecglttcuqyen.supabase.co";
}
function getSupabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
function getSupabaseAnonKey() {
    return "TURBOPACK compile-time value", "sb_publishable_ru9zRYWtaZ0jyhQoKS3aEA_tWKWx6LQ";
}
function getStorageBucket() {
    return process.env.SUPABASE_STORAGE_BUCKET || 'media';
}
}),
"[project]/lib/api-helpers.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCESS_TOKEN_COOKIE",
    ()=>ACCESS_TOKEN_COOKIE,
    "REFRESH_TOKEN_COOKIE",
    ()=>REFRESH_TOKEN_COOKIE,
    "clearAuthCookies",
    ()=>clearAuthCookies,
    "errorResponse",
    ()=>errorResponse,
    "getClientIP",
    ()=>getClientIP,
    "getUserAgent",
    ()=>getUserAgent,
    "getUserFromRequest",
    ()=>getUserFromRequest,
    "jsonResponse",
    ()=>jsonResponse,
    "paginationParams",
    ()=>paginationParams,
    "parseBody",
    ()=>parseBody,
    "setAuthCookies",
    ()=>setAuthCookies,
    "withAdmin",
    ()=>withAdmin,
    "withAuth",
    ()=>withAuth,
    "withSuperAdmin",
    ()=>withSuperAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-route] (ecmascript)");
;
;
const ACCESS_TOKEN_COOKIE = 'tbc_access_token';
const REFRESH_TOKEN_COOKIE = 'tbc_refresh_token';
function jsonResponse(data, status = 200) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data, {
        status
    });
}
function errorResponse(message, status = 400) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: message
    }, {
        status
    });
}
function cookieConfig(maxAgeSeconds) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        path: '/',
        maxAge: maxAgeSeconds
    };
}
function setAuthCookies(response, accessToken, refreshToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieConfig(60 * 60));
    if (refreshToken) {
        response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieConfig(60 * 60 * 24));
    }
    return response;
}
function clearAuthCookies(response) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
        ...cookieConfig(0),
        maxAge: 0
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
        ...cookieConfig(0),
        maxAge: 0
    });
    return response;
}
function isExpectedAuthFailure(error) {
    if (!error || typeof error !== 'object') return false;
    const authError = error;
    return authError.code === 'bad_jwt' || authError.status === 401 || authError.status === 403 || authError.message?.includes('token is expired') === true || authError.message?.includes('invalid JWT') === true;
}
async function getUserFromRequest(req) {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
    const token = bearerToken || cookieToken;
    if (!token) return null;
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { data, error } = await supabase.auth.getUser(token);
        if (error) {
            if (!isExpectedAuthFailure(error)) {
                console.error('getUserFromRequest: Supabase auth error:', error);
            }
            return null;
        }
        if (!data.user) {
            console.error('getUserFromRequest: No user in data');
            return null;
        }
        // Get user profile from public.users
        const { data: profile, error: profileError } = await supabase.from('users').select('role, is_admin').eq('id', data.user.id).single();
        if (profileError) {
            console.error('getUserFromRequest: Profile fetch error:', profileError);
        }
        return {
            id: data.user.id,
            email: data.user.email || '',
            role: profile?.role || 'user',
            isAdmin: profile?.is_admin || false
        };
    } catch  {
        return null;
    }
}
async function withAuth(req) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }
    return {
        user
    };
}
async function withAdmin(req) {
    const result = await withAuth(req);
    if (result instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]) return result;
    const { user } = result;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        return errorResponse('Forbidden: admin access required', 403);
    }
    return {
        user
    };
}
async function withSuperAdmin(req) {
    const result = await withAuth(req);
    if (result instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]) return result;
    const { user } = result;
    if (user.role !== 'super_admin') {
        return errorResponse('Forbidden: super admin access required', 403);
    }
    return {
        user
    };
}
async function parseBody(req) {
    try {
        return await req.json();
    } catch  {
        return null;
    }
}
function paginationParams(req) {
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get('limit') || '20');
    let offset = parseInt(url.searchParams.get('offset') || '0');
    if (limit <= 0) limit = 20;
    if (limit > 100) limit = 100;
    if (offset < 0) offset = 0;
    return {
        limit,
        offset
    };
}
function getClientIP(req) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
function getUserAgent(req) {
    return req.headers.get('user-agent') || 'unknown';
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/security.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_IMAGE_UPLOAD_BYTES",
    ()=>MAX_IMAGE_UPLOAD_BYTES,
    "MAX_VIDEO_UPLOAD_BYTES",
    ()=>MAX_VIDEO_UPLOAD_BYTES,
    "PUBLIC_USER_COLUMNS",
    ()=>PUBLIC_USER_COLUMNS,
    "buildSafeObjectPath",
    ()=>buildSafeObjectPath,
    "getUploadConstraints",
    ()=>getUploadConstraints,
    "issueEmailOTP",
    ()=>issueEmailOTP,
    "normalizeEmail",
    ()=>normalizeEmail,
    "sanitizePlainText",
    ()=>sanitizePlainText,
    "sanitizeSearchQuery",
    ()=>sanitizeSearchQuery,
    "sanitizeUserContent",
    ()=>sanitizeUserContent,
    "validateAvatarURL",
    ()=>validateAvatarURL,
    "validateWebsiteURL",
    ()=>validateWebsiteURL,
    "verifyOTPCode",
    ()=>verifyOTPCode
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const PUBLIC_USER_COLUMNS = `
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
    'image/gif'
]);
const ALLOWED_VIDEO_MIME_TYPES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime'
]);
const FILE_EXTENSION_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov'
};
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function sanitizePlainText(input, maxLength) {
    const sanitized = input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (maxLength === undefined) {
        return sanitized;
    }
    return sanitized.slice(0, maxLength);
}
function sanitizeUserContent(input) {
    return input.replace(/<[^>]*>/g, '').replace(/\r\n/g, '\n').trim();
}
function sanitizeSearchQuery(input) {
    return input.replace(/[%_*(),]/g, ' ').replace(/\s+/g, ' ').trim();
}
function validateWebsiteURL(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    let url;
    try {
        url = new URL(trimmed);
    } catch  {
        return null;
    }
    if (![
        'http:',
        'https:'
    ].includes(url.protocol)) {
        return null;
    }
    if (url.username || url.password) {
        return null;
    }
    return url.toString();
}
function validateAvatarURL(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    let url;
    try {
        url = new URL(trimmed);
    } catch  {
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
function getUploadConstraints(mimeType) {
    if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
        return {
            mediaType: 'image',
            maxBytes: MAX_IMAGE_UPLOAD_BYTES
        };
    }
    if (ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
        return {
            mediaType: 'video',
            maxBytes: MAX_VIDEO_UPLOAD_BYTES
        };
    }
    return null;
}
function buildSafeObjectPath(mediaID, mimeType) {
    const extension = FILE_EXTENSION_BY_MIME[mimeType];
    if (!extension) {
        throw new Error('Unsupported file type');
    }
    return `${mediaID}/upload.${extension}`;
}
async function issueEmailOTP(supabase, params) {
    const code = String((0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomInt"])(100000, 999999));
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashedCode = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(code).digest('hex');
    await supabase.from('otps').update({
        used: true
    }).eq('user_id', params.userID).eq('type', params.type).eq('used', false);
    await supabase.from('otps').insert({
        user_id: params.userID,
        email: params.email,
        code: hashedCode,
        type: params.type,
        expires_at: expiresAt,
        used: false,
        attempts: 0,
        created_at: now
    });
    if (!params.resendAPIKey) {
        return;
    }
    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${params.resendAPIKey}`
        },
        body: JSON.stringify({
            from: params.resendFrom || 'noreply@techbantcommunity.com',
            to: params.email,
            subject: params.subject,
            html: params.html(code)
        })
    });
}
async function verifyOTPCode(supabase, params) {
    const { data: otp } = await supabase.from('otps').select('*').eq('user_id', params.userID).eq('email', params.email).eq('type', params.type).eq('used', false).order('created_at', {
        ascending: false
    }).limit(1).single();
    if (!otp) {
        return {
            ok: false,
            reason: 'Invalid or expired code'
        };
    }
    if (new Date(otp.expires_at) < new Date()) {
        await supabase.from('otps').update({
            used: true
        }).eq('id', otp.id);
        return {
            ok: false,
            reason: 'Code expired'
        };
    }
    if ((otp.attempts || 0) >= 5) {
        await supabase.from('otps').update({
            used: true
        }).eq('id', otp.id);
        return {
            ok: false,
            reason: 'Too many attempts'
        };
    }
    const hashedInput = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(params.code).digest('hex');
    if (hashedInput !== otp.code) {
        await supabase.from('otps').update({
            attempts: (otp.attempts || 0) + 1
        }).eq('id', otp.id);
        return {
            ok: false,
            reason: 'Invalid code'
        };
    }
    await supabase.from('otps').update({
        used: true
    }).eq('id', otp.id);
    return {
        ok: true
    };
}
}),
"[project]/lib/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateLoginPayload",
    ()=>validateLoginPayload,
    "validateReportPayload",
    ()=>validateReportPayload,
    "validateSignupPayload",
    ()=>validateSignupPayload
]);
(()=>{
    const e = new Error("Cannot find module './security.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
function validateLoginPayload(body) {
    if (!body) return {
        ok: false,
        error: 'Invalid request body'
    };
    const email = normalizeEmail(body.email || '');
    if (!email || !email.includes('@')) return {
        ok: false,
        error: 'Valid email is required'
    };
    const password = body.password?.trim() || '';
    if (!password) return {
        ok: false,
        error: 'Password is required'
    };
    const otpCode = body.otpCode?.trim();
    if (otpCode && !/^\d{6}$/.test(otpCode)) return {
        ok: false,
        error: 'OTP code must be 6 digits'
    };
    return {
        ok: true,
        data: {
            email,
            password,
            otpCode
        }
    };
}
function validateSignupPayload(body) {
    if (!body) return {
        ok: false,
        error: 'Invalid request body'
    };
    const email = normalizeEmail(body.email || '');
    if (!email || !email.includes('@')) return {
        ok: false,
        error: 'Valid email is required'
    };
    const password = body.password || '';
    if (password.length < 8) return {
        ok: false,
        error: 'Password must be at least 8 characters'
    };
    const name = sanitizePlainText(body.name || '', 100);
    if (!name) return {
        ok: false,
        error: 'Name is required'
    };
    return {
        ok: true,
        data: {
            email,
            password,
            name
        }
    };
}
function validateReportPayload(body) {
    if (!body) return {
        ok: false,
        error: 'Invalid request body'
    };
    const reason = sanitizePlainText(body.reason || '', 1000);
    if (!reason) return {
        ok: false,
        error: 'Reason is required'
    };
    if (!body.post_id && !body.comment_id) return {
        ok: false,
        error: 'Post or comment ID is required'
    };
    if (body.post_id && body.comment_id) return {
        ok: false,
        error: 'Only one report target can be submitted at a time'
    };
    return {
        ok: true,
        data: {
            post_id: body.post_id,
            comment_id: body.comment_id,
            reason
        }
    };
}
}),
"[project]/app/api/v1/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/security.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validation.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(req) {
    try {
        const body = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBody"])(req);
        const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateLoginPayload"])(body);
        if (!validation.ok) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])(validation.error);
        const { email, password, otpCode } = validation.data;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const ipAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getClientIP"])(req);
        const userAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserAgent"])(req);
        const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', email).single();
        // Check lockout early when user exists
        if (user) {
            const { data: existingLockout } = await supabase.from('account_lockouts').select('*').eq('user_id', user.id).single();
            if (existingLockout?.locked_until && new Date(existingLockout.locked_until) > new Date()) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Account temporarily locked due to multiple failed login attempts', 423);
            }
        }
        // Verify password with Supabase Auth
        const supabaseURL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseURL"])();
        const anonKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAnonKey"])();
        const authResp = await fetch(`${supabaseURL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        if (!authResp.ok) {
            // Record failed login
            if (user) {
                // Check / update lockout
                const { data: lockout } = await supabase.from('account_lockouts').select('*').eq('user_id', user.id).single();
                if (lockout) {
                    const newAttempts = (lockout.failed_attempts || 0) + 1;
                    const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : lockout.locked_until;
                    await supabase.from('account_lockouts').update({
                        failed_attempts: newAttempts,
                        locked_until: lockedUntil
                    }).eq('user_id', user.id);
                } else {
                    await supabase.from('account_lockouts').insert({
                        user_id: user.id,
                        failed_attempts: 1,
                        created_at: new Date().toISOString()
                    });
                }
            }
            await supabase.from('security_events').insert({
                user_id: user?.id || null,
                event_type: 'login_attempt',
                ip_address: ipAddress,
                user_agent: userAgent,
                success: false,
                details: 'invalid_credentials',
                created_at: new Date().toISOString()
            });
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Invalid credentials', 401);
        }
        const authData = await authResp.json();
        const accessToken = authData.access_token;
        if (userError || !user) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Invalid credentials', 401);
        // Check active
        if (!user.is_active) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Account is inactive', 403);
        }
        const { data: twoFA } = await supabase.from('two_factor_auth').select('enabled').eq('user_id', user.id).single();
        if (twoFA?.enabled) {
            if (!otpCode) {
                try {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["issueEmailOTP"])(supabase, {
                        userID: user.id,
                        email,
                        type: '2fa',
                        resendAPIKey: process.env.RESEND_API_KEY,
                        resendFrom: process.env.RESEND_FROM || 'noreply@techbantcommunity.com',
                        subject: 'Your Login Verification Code',
                        html: (code)=>`<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`
                    });
                } catch (otpError) {
                    console.error('Failed to issue login OTP:', otpError);
                }
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Two-factor authentication required', 401);
            }
            const otpResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyOTPCode"])(supabase, {
                userID: user.id,
                email,
                type: '2fa',
                code: otpCode
            });
            if (!otpResult.ok) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])(otpResult.reason, 401);
            }
        }
        // Reset failed attempts
        await supabase.from('account_lockouts').delete().eq('user_id', user.id);
        // Create session
        const now = new Date().toISOString();
        const sessionID = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomBytes"])(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('sessions').insert({
            id: sessionID,
            user_id: user.id,
            token_id: accessToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: now,
            expires_at: expiresAt,
            last_activity: now,
            is_active: true
        });
        // Log success
        await supabase.from('security_events').insert({
            user_id: user.id,
            event_type: 'login',
            ip_address: ipAddress,
            user_agent: userAgent,
            success: true,
            created_at: now
        });
        const permissions = getRolePermissions(user.role);
        const response = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])({
            token: accessToken,
            refreshToken: sessionID,
            expiresIn: 86400,
            user,
            roles: [
                user.role
            ],
            permissions
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setAuthCookies"])(response, accessToken, sessionID);
    } catch (error) {
        console.error('Login error:', error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Internal server error', 500);
    }
}
function getRolePermissions(role) {
    switch(role){
        case 'super_admin':
            return [
                'read',
                'write',
                'delete',
                'admin',
                'manage_admins',
                'manage_roles',
                'view_analytics'
            ];
        case 'admin':
            return [
                'read',
                'write',
                'delete',
                'admin',
                'view_analytics'
            ];
        default:
            return [
                'read',
                'write'
            ];
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__98a3cc14._.js.map