-- OAuth states table for CSRF protection in OAuth flows
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.oauth_states (
    state TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    redirect_url TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);
