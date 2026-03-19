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
"[project]/app/api/v1/auth/verify/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-route] (ecmascript)");
;
;
async function GET(req) {
    try {
        const authResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withAuth"])(req);
        if (authResult instanceof Response) {
            return authResult.status === 401 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clearAuthCookies"])(authResult) : authResult;
        }
        const { user: authUser } = authResult;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { data: user, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        if (error || !user) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('User not found', 404);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])({
            user
        });
    } catch (error) {
        console.error('Verify error:', error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Internal server error', 500);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9905c62d._.js.map