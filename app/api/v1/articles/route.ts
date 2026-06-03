import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, paginationParams, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText, sanitizeUserContent } from '@/lib/security';


function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 200) || 'untitled';
}

function generateUniqueSlug(slug: string, suffix?: string): string {
    const base = suffix ? `${slug}-${suffix}` : slug;
    return base.slice(0, 200);
}

function isAdminOrAbove(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

function canPublish(role?: string): boolean {
    return role === 'super_admin';
}

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { limit, offset } = paginationParams(req);
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const categoryId = url.searchParams.get('category_id');
        const authorId = url.searchParams.get('author_id');
        const search = url.searchParams.get('search');

        let query = supabase
            .from('articles')
            .select('*, author:author_id(id, name, email, avatar, role), category:category_id(id, name, slug)')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        } else {
            // Default: only show published for public; admins see all
            const user = await getUserFromRequest(req);
            if (!isAdminOrAbove(user?.role)) {
                query = query.eq('status', 'published');
            }
        }

        if (categoryId) query = query.eq('category_id', categoryId);
        if (authorId) query = query.eq('author_id', authorId);
        if (search) {
            query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
        }

        const { data: articles, error } = await query;
        if (error) return errorResponse('Failed to fetch articles', 500);

        return jsonResponse(articles || []);
    } catch (error: unknown) {
        console.error('Get articles error:', error);
        return errorResponse('Internal server error', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const user = await getUserFromRequest(req);
        if (!user) return errorResponse('Unauthorized', 401);
        if (!isAdminOrAbove(user.role)) return errorResponse('Forbidden: admin access required', 403);

        const body = await parseBody<{
            title: string;
            content: Record<string, unknown>;
            html_content?: string;
            excerpt?: string;
            featured_image?: string;
            featured_image_caption?: string;
            category_id?: string;
            tags?: string[];
            status?: string;
            scheduled_at?: string;
            meta_title?: string;
            meta_description?: string;
            og_image?: string;
            canonical_url?: string;
        }>(req);

        if (!body) return errorResponse('Invalid request body');
        if (!body.title?.trim()) return errorResponse('Title is required');

        const title = sanitizePlainText(body.title.trim(), 300);
        const rawSlug = slugify(title);
        const now = new Date().toISOString();

        // Generate unique slug
        const slug = generateUniqueSlug(rawSlug, Date.now().toString(36));

        const excerpt = body.excerpt ? sanitizeUserContent(body.excerpt.substring(0, 500)) : null;
        const content = body.content || {};
        const htmlContent = body.html_content || null;
        const featuredImage = body.featured_image ? sanitizePlainText(body.featured_image, 1000) : null;
        const featuredImageCaption = body.featured_image_caption ? sanitizePlainText(body.featured_image_caption, 500) : null;
        const categoryId = body.category_id || null;
        const tags = (body.tags || []).map(t => sanitizePlainText(t, 100)).filter(Boolean).slice(0, 20);
        const status = body.status || 'draft';
        const scheduledAt = body.scheduled_at || null;

        if (status === 'scheduled' && !scheduledAt) {
            return errorResponse('Scheduled date is required for scheduled status', 400);
        }
        if (status === 'published' && !canPublish(user.role)) {
            return errorResponse('Only super admins can publish articles', 403);
        }

        // Count words from HTML
        const wordCount = htmlContent ? htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
        const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        const { data: article, error } = await supabase
            .from('articles')
            .insert({
                title,
                slug,
                excerpt,
                content,
                html_content: htmlContent,
                featured_image: featuredImage,
                featured_image_caption: featuredImageCaption,
                category_id: categoryId,
                author_id: user.id,
                status,
                scheduled_at: scheduledAt,
                published_at: status === 'published' ? now : null,
                meta_title: body.meta_title ? sanitizePlainText(body.meta_title, 200) : null,
                meta_description: body.meta_description ? sanitizePlainText(body.meta_description, 300) : null,
                og_image: body.og_image ? sanitizePlainText(body.og_image, 1000) : null,
                canonical_url: body.canonical_url ? sanitizePlainText(body.canonical_url, 1000) : null,
                word_count: wordCount,
                reading_time_minutes: readingTimeMinutes,
                created_at: now,
                updated_at: now,
            })
            .select('*, author:author_id(id, name, email, avatar, role), category:category_id(id, name, slug)')
            .single();

        if (error) return errorResponse('Failed to create article', 500);

        // Insert tags
        if (tags.length > 0) {
            const tagInserts = tags.map(tag => ({
                article_id: article.id,
                tag,
            }));
            const { error: tagsError } = await supabase.from('article_tags').insert(tagInserts);
            if (tagsError) console.error('Failed to insert tags:', tagsError);
        }

        // Create initial revision
        const { error: revError } = await supabase.from('article_revisions').insert({
            article_id: article.id,
            title,
            content,
            html_content: htmlContent,
            excerpt,
            featured_image: featuredImage,
            category_id: categoryId,
            editor_id: user.id,
            change_summary: 'Initial version',
            created_at: now,
        });
        if (revError) console.error('Failed to create initial revision:', revError);

        return jsonResponse(article, 201);
    } catch (error: unknown) {
        console.error('Create article error:', error);
        return errorResponse('Internal server error', 500);
    }
}
