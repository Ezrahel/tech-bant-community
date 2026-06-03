import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse, parseBody, getUserFromRequest } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sanitizePlainText } from '@/lib/security';

function isAdminOrAbove(role?: string): boolean {
    return role === 'admin' || role === 'super_admin';
}

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data: categories, error } = await supabase
            .from('article_categories')
            .select('*')
            .order('name');

        if (error) return errorResponse('Failed to fetch categories', 500);
        return jsonResponse(categories || []);
    } catch (error: unknown) {
        console.error('Get article categories error:', error);
        return errorResponse('Internal server error', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || !isAdminOrAbove(user.role)) return errorResponse('Unauthorized', 401);

        const body = await parseBody<{ name: string; description?: string }>(req);
        if (!body || !body.name?.trim()) return errorResponse('Category name is required');

        const name = sanitizePlainText(body.name.trim(), 100);
        const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
        const description = body.description ? sanitizePlainText(body.description.trim(), 500) : null;

        const supabase = getSupabaseAdmin();
        const { data: category, error } = await supabase
            .from('article_categories')
            .insert({ name, slug, description })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') return errorResponse('Category with this name already exists', 409);
            return errorResponse('Failed to create category', 500);
        }

        return jsonResponse(category, 201);
    } catch (error: unknown) {
        console.error('Create article category error:', error);
        return errorResponse('Internal server error', 500);
    }
}
