-- Additional performance indexes for high-traffic query patterns
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- ── Enable pg_trgm extension for fast ILIKE searches ─────────────────────
-- Powers user search: SELECT ... FROM users WHERE name ILIKE '%query%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_trgm
    ON public.users USING gin (name gin_trgm_ops);

-- ── likes: user + comment lookup ─────────────────────────────────────────
-- Powers comment like-status checks:
--   SELECT id FROM likes WHERE comment_id = $cid AND user_id = $uid
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_comment
    ON public.likes (user_id, comment_id)
    WHERE comment_id IS NOT NULL;

-- ── posts: created_at + id for cursor-based pagination ───────────────────
-- Enables efficient keyset pagination on the post feed:
--   SELECT ... FROM posts ORDER BY created_at DESC, id DESC LIMIT $n
--   WHERE (created_at, id) < ($cursor_time, $cursor_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_id
    ON public.posts (created_at DESC, id DESC);

-- ── follows: following_id for follower count queries ─────────────────────
-- Speeds up: SELECT COUNT(*) FROM follows WHERE following_id = $uid
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_count
    ON public.follows (following_id, created_at DESC);

-- ── media: post_id + type for media gallery queries ──────────────────────
-- Speeds up: SELECT ... FROM media WHERE post_id = $pid AND type = $type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_post_type
    ON public.media (post_id, type)
    WHERE post_id IS NOT NULL;
