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

const bucketEnsured = new Set<string>();

export async function ensureStorageBucket(bucket?: string): Promise<void> {
    const bucketName = bucket || getStorageBucket();
    if (bucketEnsured.has(bucketName)) return;

    const supabaseURL = getSupabaseURL();
    const serviceKey = getSupabaseServiceKey();

    // Check if bucket exists
    const checkResp = await fetch(`${supabaseURL}/storage/v1/bucket/${bucketName}`, {
        headers: { 'Authorization': `Bearer ${serviceKey}` },
    });

    if (checkResp.ok) {
        bucketEnsured.add(bucketName);
        return;
    }

    // Create the bucket
    const createResp = await fetch(`${supabaseURL}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: bucketName,
            name: bucketName,
            public: true,
            file_size_limit: 10 * 1024 * 1024,
            allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'image/svg+xml'],
        }),
    });

    if (!createResp.ok) {
        const errBody = await createResp.text();
        console.error(`Failed to create storage bucket "${bucketName}":`, errBody);
        throw new Error(`Failed to create storage bucket: ${errBody}`);
    }

    // Set bucket to public
    await fetch(`${supabaseURL}/storage/v1/bucket/${bucketName}/public`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public: true }),
    });

    bucketEnsured.add(bucketName);
}
