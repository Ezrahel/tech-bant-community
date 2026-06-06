-- Add cover photo support for user profiles
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS cover_photo TEXT;
