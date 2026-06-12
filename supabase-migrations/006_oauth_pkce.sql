-- Add PKCE code_verifier column to oauth_states for server-side PKCE flow
-- Run in Supabase SQL Editor after 005_oauth_states.sql

ALTER TABLE public.oauth_states
    ADD COLUMN IF NOT EXISTS code_verifier TEXT;
