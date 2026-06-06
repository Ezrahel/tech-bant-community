-- Add rich-text HTML storage for community posts
-- Run in Supabase SQL Editor after the main schema

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS html_content TEXT;
