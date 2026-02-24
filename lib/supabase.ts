import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side admin client (uses service role key - full access, bypasses RLS)
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (!adminClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (!url || !serviceKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        }
        adminClient = createClient(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return adminClient;
}

// Server-side anon client (for Supabase Auth signup/login calls)
let anonClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient {
    if (!anonClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        if (!url || !anonKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
        }
        anonClient = createClient(url, anonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return anonClient;
}

// Helper to get Supabase URL for direct REST calls
export function getSupabaseURL(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function getSupabaseServiceKey(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

export function getSupabaseAnonKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}

export function getStorageBucket(): string {
    return process.env.SUPABASE_STORAGE_BUCKET || 'media';
}
