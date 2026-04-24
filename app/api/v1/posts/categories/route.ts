import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { categories as sampleCategories } from '@/src/data/sampleData';

function isMissingPostsTableError(error: { code?: string; message?: string } | null | undefined) {
    return error?.code === 'PGRST205' && error.message?.includes("table 'public.posts'");
}

// GET /api/v1/posts/categories
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // Get all unique categories and their counts from the posts table
        const { data, error } = await supabase
            .from('posts')
            .select('category');

        if (error) {
            if (isMissingPostsTableError(error)) {
                console.warn('Falling back to sample categories because public.posts is missing from Supabase schema cache.');
                return jsonResponse(sampleCategories);
            }
            console.error('Error fetching categories:', error);
            return errorResponse('Failed to fetch category counts', 500);
        }

        // Aggregate counts
        const counts: Record<string, number> = {};
        let totalCount = 0;

        (data || []).forEach(post => {
            const cat = post.category || 'general';
            counts[cat] = (counts[cat] || 0) + 1;
            totalCount++;
        });

        const categories = [
            { id: 'all', name: 'All', count: totalCount },
            { id: 'general', name: 'General', count: counts['general'] || 0 },
            { id: 'tech', name: 'Tech', count: counts['tech'] || 0 },
            { id: 'reviews', name: 'Reviews', count: counts['reviews'] || 0 },
            { id: 'updates', name: 'Updates', count: counts['updates'] || 0 },
            { id: 'gists', name: 'Gists', count: counts['gists'] || 0 },
            { id: 'banter', name: 'Banter', count: counts['banter'] || 0 },
        ];

        return jsonResponse(categories);
    } catch (error: unknown) {
        console.error('Get categories error:', error);
        return errorResponse('Internal server error', 500);
    }
}
