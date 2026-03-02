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
"[project]/app/api/v1/posts/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
async function GET(req) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { limit, offset } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["paginationParams"])(req);
        const url = new URL(req.url);
        const category = url.searchParams.get('category');
        let query = supabase.from('posts').select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)').order('created_at', {
            ascending: false
        }).range(offset, offset + limit - 1);
        if (category) {
            query = query.eq('category', category);
        }
        const { data: posts, error } = await query;
        if (error) {
            console.error('Supabase fetch posts error:', error);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Failed to fetch posts', 500);
        }
        // Check for likes/bookmarks if user is authenticated
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserFromRequest"])(req);
        let postsWithStatus = posts || [];
        if (user && posts && posts.length > 0) {
            const postIds = posts.map((p)=>p.id);
            const [{ data: userLikes }, { data: userBookmarks }] = await Promise.all([
                supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
                supabase.from('bookmarks').select('post_id').in('post_id', postIds).eq('user_id', user.id)
            ]);
            const likedPostIds = new Set(userLikes?.map((l)=>l.post_id) || []);
            const bookmarkedPostIds = new Set(userBookmarks?.map((b)=>b.post_id) || []);
            postsWithStatus = posts.map((post)=>({
                    ...post,
                    is_liked: likedPostIds.has(post.id),
                    is_bookmarked: bookmarkedPostIds.has(post.id)
                }));
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])(postsWithStatus);
    } catch (error) {
        console.error('Get posts error:', error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Internal server error', 500);
    }
}
async function POST(req) {
    try {
        const authResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withAuth"])(req);
        if (authResult instanceof Response) return authResult;
        const { user } = authResult;
        const body = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseBody"])(req);
        if (!body) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Invalid request body');
        const { title, content, category, tags, location, mediaIds } = body;
        if (!title?.trim()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Title is required');
        if (!content?.trim()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Content is required');
        if (!category?.trim()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Category is required');
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        // Check for duplicate
        const contentHash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(`${user.id}:${title}:${content}`).digest('hex');
        const { data: existing } = await supabase.from('posts').select('id').eq('author_id', user.id).eq('content_hash', contentHash).limit(1).single();
        if (existing) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Duplicate post detected', 409);
        const now = new Date().toISOString();
        // Insert post
        const { data: post, error } = await supabase.from('posts').insert({
            title,
            content,
            author_id: user.id,
            category,
            tags: tags || [],
            likes: 0,
            comments: 0,
            views: 0,
            shares: 0,
            is_pinned: false,
            is_hot: false,
            location: location || null,
            content_hash: contentHash,
            published_at: now,
            created_at: now,
            updated_at: now
        }).select('*, author:users!author_id(id, name, email, avatar, is_admin, is_verified)').single();
        if (error) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Failed to create post', 500);
        // Increment user posts count
        const { data: authorProfile } = await supabase.from('users').select('posts_count').eq('id', user.id).single();
        await supabase.from('users').update({
            posts_count: (authorProfile?.posts_count || 0) + 1,
            updated_at: now
        }).eq('id', user.id);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonResponse"])(post, 201);
    } catch (error) {
        console.error('Create post error:', error);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["errorResponse"])('Internal server error', 500);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__69cd8b21._.js.map