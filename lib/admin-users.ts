import { getSupabaseAdmin } from './supabase';
import { normalizeEmail } from './security';

export type AdminRole = 'admin' | 'super_admin';

const DEFAULT_AVATAR = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop';

function isDuplicateAuthUserError(message?: string) {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('already been registered') || normalized.includes('already registered') || normalized.includes('duplicate');
}

export async function countSuperAdmins(): Promise<number> {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

    if (error) {
        throw new Error(error.message || 'Failed to count super admins');
    }

    return count || 0;
}

export async function createAdminUser(params: {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
}) {
    const supabase = getSupabaseAdmin();
    const email = normalizeEmail(params.email);
    const now = new Date().toISOString();

    const buildProfile = (userID: string) => ({
        id: userID,
        name: params.name.trim(),
        email,
        avatar: DEFAULT_AVATAR,
        is_admin: true,
        is_verified: true,
        is_active: true,
        role: params.role,
        provider: 'email',
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        created_at: now,
        updated_at: now,
    });

    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (existingUserError) {
        throw new Error(existingUserError.message || 'Failed to check existing admin user');
    }

    if (existingUser) {
        throw new Error('A user with this email already exists');
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: params.password,
        email_confirm: true,
        user_metadata: { name: params.name.trim() },
    });

    if (authError || !authData.user) {
        if (!existingUser && isDuplicateAuthUserError(authError?.message)) {
            throw new Error('Auth user already exists for this email, but no matching profile was found in public.users');
        }
        throw new Error(authError?.message || 'Failed to create auth user');
    }

    const profile = buildProfile(authData.user.id);
    const { data: createdUser, error: profileError } = await supabase
        .from('users')
        .upsert(profile, { onConflict: 'id' })
        .select('*')
        .single();

    if (profileError || !createdUser) {
        await supabase.auth.admin.deleteUser(authData.user.id).catch((cleanupError) => {
            console.error('Failed to clean up auth user after admin profile error:', cleanupError);
        });
        throw new Error(profileError?.message || 'Failed to create admin profile');
    }

    return createdUser;
}

export async function promoteExistingUserToAdmin(params: {
    userID: string;
    role: AdminRole;
}) {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.userID)
        .single();

    if (existingUserError || !existingUser) {
        throw new Error(existingUserError?.message || 'User not found');
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(params.userID, {
        email: existingUser.email,
        email_confirm: true,
        user_metadata: { name: existingUser.name },
    });

    if (authUpdateError) {
        throw new Error(authUpdateError.message || 'Failed to update existing auth user');
    }

    const { data: promotedUser, error: promoteError } = await supabase
        .from('users')
        .update({
            is_admin: true,
            is_verified: existingUser.is_verified ?? true,
            is_active: existingUser.is_active ?? true,
            role: params.role,
            updated_at: now,
        })
        .eq('id', params.userID)
        .select('*')
        .single();

    if (promoteError || !promotedUser) {
        throw new Error(promoteError?.message || 'Failed to promote existing user');
    }

    return promotedUser;
}

export async function bootstrapSuperAdminUser(params: {
    name: string;
    email: string;
    password: string;
}) {
    const supabase = getSupabaseAdmin();
    const email = normalizeEmail(params.email);

    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (existingUserError) {
        throw new Error(existingUserError.message || 'Failed to check existing bootstrap user');
    }

    if (existingUser) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            email,
            password: params.password,
            email_confirm: true,
            user_metadata: { name: params.name.trim() },
        });

        if (authUpdateError) {
            throw new Error(authUpdateError.message || 'Failed to update existing auth user');
        }

        return promoteExistingUserToAdmin({
            userID: existingUser.id,
            role: 'super_admin',
        });
    }

    return createAdminUser({
        ...params,
        role: 'super_admin',
    });
}
