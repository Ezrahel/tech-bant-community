import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText, sanitizeUserContent } from '@/lib/security';

function isAdminOrAbove(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

function canPublish(role?: string): boolean {
    return role === 'super_admin';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();

        const { data: article, error } = await supabase
            .from('articles')
            .select('*, author:author_id(id, name, email, avatar, role, bio), category:category_id(id, name, slug), tags:article_tags(tag)')
            .eq('id', id)
            .single();

        if (error || !article) return errorResponse('Article not found', 404);

        // Check access
        const user = await getUserFromRequest(req);
        if (article.status !== 'published' && !isAdminOrAbove(user?.role)) {
            return errorResponse('Article not found', 404);
        }

        // Increment view count
        await supabase.rpc('increment_article_views', { article_id: id }).catch(() => {
            supabase.from('articles').update({ view_count: (article.view_count || 0) + 1 }).eq('id', id).catch(() => {});
        });

        return jsonResponse(article);
    } catch (error: unknown) {
        console.error('Get article error:', error);
        return errorResponse('Internal server error', 500);
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();
        const user = await getUserFromRequest(req);
        if (!user) return errorResponse('Unauthorized', 401);
        if (!isAdminOrAbove(user.role)) return errorResponse('Forbidden: admin access required', 403);

        const body = await parseBody<{
            title?: string;
            content?: Record<string, unknown>;
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
            change_summary?: string;
        }>(req);

        if (!body) return errorResponse('Invalid request body');

        // Get existing article
        const { data: existing, error: fetchError } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) return errorResponse('Article not found', 404);
        if (existing.author_id !== user.id && user.role !== 'super_admin') {
            return errorResponse('Forbidden', 403);
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.title !== undefined) {
            const title = sanitizePlainText(body.title.trim(), 300);
            if (!title) return errorResponse('Title is required');
            updates.title = title;
        }
        if (body.content !== undefined) updates.content = body.content;
        if (body.html_content !== undefined) {
            updates.html_content = body.html_content;
            const wordCount = body.html_content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
            updates.word_count = wordCount;
            updates.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
        }
        if (body.excerpt !== undefined) updates.excerpt = body.excerpt ? sanitizeUserContent(body.excerpt.substring(0, 500)) : null;
        if (body.featured_image !== undefined) updates.featured_image = body.featured_image ? sanitizePlainText(body.featured_image, 1000) : null;
        if (body.featured_image_caption !== undefined) updates.featured_image_caption = body.featured_image_caption ? sanitizePlainText(body.featured_image_caption, 500) : null;
        if (body.category_id !== undefined) updates.category_id = body.category_id || null;
        if (body.meta_title !== undefined) updates.meta_title = body.meta_title ? sanitizePlainText(body.meta_title, 200) : null;
        if (body.meta_description !== undefined) updates.meta_description = body.meta_description ? sanitizePlainText(body.meta_description, 300) : null;
        if (body.og_image !== undefined) updates.og_image = body.og_image ? sanitizePlainText(body.og_image, 1000) : null;
        if (body.canonical_url !== undefined) updates.canonical_url = body.canonical_url ? sanitizePlainText(body.canonical_url, 1000) : null;

        // Status changes
        if (body.status !== undefined) {
            if (body.status === 'published' && !canPublish(user.role)) {
                return errorResponse('Only super admins can publish articles', 403);
            }
            if (body.status === 'scheduled' && !body.scheduled_at) {
                return errorResponse('Scheduled date is required', 400);
            }
            updates.status = body.status;
            if (body.status === 'published') {
                updates.published_at = new Date().toISOString();
            }
            if (body.scheduled_at !== undefined) {
                updates.scheduled_at = body.scheduled_at || null;
            }
        }

        const { data: article, error } = await supabase
            .from('articles')
            .update(updates)
            .eq('id', id)
            .select('*, author:author_id(id, name, email, avatar, role), category:category_id(id, name, slug)')
            .single();

        if (error) return errorResponse('Failed to update article', 500);

        // Update tags
        if (body.tags !== undefined) {
            await supabase.from('article_tags').delete().eq('article_id', id);
            const validTags = body.tags.map(t => sanitizePlainText(t, 100)).filter(Boolean).slice(0, 20);
            if (validTags.length > 0) {
                await supabase.from('article_tags').insert(validTags.map(tag => ({ article_id: id, tag })));
            }
        }

        // Create revision
        const finalTitle = (updates.title as string) || existing.title;
        const finalContent = (updates.content as Record<string, unknown>) || existing.content;
        const finalHtml = (updates.html_content as string) || existing.html_content;
        const finalExcerpt = updates.excerpt !== undefined ? (updates.excerpt as string) : existing.excerpt;
        const finalImage = updates.featured_image !== undefined ? (updates.featured_image as string) : existing.featured_image;
        const finalCategoryId = updates.category_id !== undefined ? (updates.category_id as string) : existing.category_id;

        await supabase.from('article_revisions').insert({
            article_id: id,
            title: finalTitle,
            content: finalContent,
            html_content: finalHtml,
            excerpt: finalExcerpt,
            featured_image: finalImage,
            category_id: finalCategoryId,
            editor_id: user.id,
            change_summary: body.change_summary || `Updated by ${user.email}`,
            created_at: new Date().toISOString(),
        });

        return jsonResponse(article);
    } catch (error: unknown) {
        console.error('Update article error:', error);
        return errorResponse('Internal server error', 500);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();
        const user = await getUserFromRequest(req);
        if (!user) return errorResponse('Unauthorized', 401);
        if (user.role !== 'super_admin') return errorResponse('Forbidden: super admin access required', 403);

        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (error) return errorResponse('Failed to delete article', 500);

        return jsonResponse({ message: 'Article deleted' });
    } catch (error: unknown) {
        console.error('Delete article error:', error);
        return errorResponse('Internal server error', 500);
    }
}
