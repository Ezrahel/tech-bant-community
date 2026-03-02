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
async function getUserFromRequest(req) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    if (!token) return null;
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { data, error } = await supabase.auth.getUser(token);
        if (error) {
            console.error('getUserFromRequest: Supabase auth error:', error);
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
"[project]/app/api/v1/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
async function POST(req) {
    try {
        const body = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBody"])(req);
        if (!body) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Invalid request body');
        const { email, password } = body;
        if (!email || !email.includes('@')) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Valid email is required');
        if (!password?.trim()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Password is required');
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const ipAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getClientIP"])(req);
        const userAgent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserAgent"])(req);
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
            const { data: userRecord } = await supabase.from('users').select('id').eq('email', email).single();
            if (userRecord) {
                // Check / update lockout
                const { data: lockout } = await supabase.from('account_lockouts').select('*').eq('user_id', userRecord.id).single();
                if (lockout) {
                    const newAttempts = (lockout.failed_attempts || 0) + 1;
                    const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : lockout.locked_until;
                    await supabase.from('account_lockouts').update({
                        failed_attempts: newAttempts,
                        locked_until: lockedUntil
                    }).eq('user_id', userRecord.id);
                } else {
                    await supabase.from('account_lockouts').insert({
                        user_id: userRecord.id,
                        failed_attempts: 1,
                        created_at: new Date().toISOString()
                    });
                }
            }
            await supabase.from('security_events').insert({
                user_id: userRecord?.id || null,
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
        // Get user by email
        const { data: user, error: userError } = await supabase.from('users').select('*').eq('email', email).single();
        if (userError || !user) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Invalid credentials', 401);
        // Check lockout
        const { data: lockout } = await supabase.from('account_lockouts').select('*').eq('user_id', user.id).single();
        if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Account temporarily locked due to multiple failed login attempts', 423);
        }
        // Check active
        if (!user.is_active) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Account is inactive', 403);
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
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])({
            token: accessToken,
            refreshToken: sessionID,
            expiresIn: 86400,
            user,
            roles: [
                user.role
            ],
            permissions
        });
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

//# sourceMappingURL=%5Broot-of-the-server%5D__266855a1._.js.map