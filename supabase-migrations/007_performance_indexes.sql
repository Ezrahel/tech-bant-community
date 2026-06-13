-- Performance indexes for high-concurrency reads
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- NOTE: CONCURRENTLY is omitted because the Supabase SQL editor executes
-- statements inside a transaction block, and PostgreSQL forbids
-- CREATE INDEX CONCURRENTLY inside a transaction.
-- Each index below uses a brief exclusive lock during creation; on typical
-- community-sized tables this completes in under a second.

-- ── likes ─────────────────────────────────────────────────────────────────
-- Powers the per-user like-status bulk lookup in GET /posts:
--   SELECT post_id FROM likes WHERE post_id = ANY($postIds) AND user_id = $uid
CREATE INDEX IF NOT EXISTS idx_likes_user_post
    ON public.likes (user_id, post_id)
    WHERE post_id IS NOT NULL;

-- ── bookmarks ─────────────────────────────────────────────────────────────
-- Powers the per-user bookmark-status bulk lookup in GET /posts.
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post
    ON public.bookmarks (user_id, post_id);

-- ── posts: category + time ────────────────────────────────────────────────
-- Powers the category-filtered feed:
--   SELECT ... FROM posts WHERE category = $cat ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_category_created
    ON public.posts (category, created_at DESC);

-- ── sessions: active lookup ───────────────────────────────────────────────
-- Powers the refresh-token validation:
--   SELECT ... FROM sessions WHERE id = $sid AND is_active = true
CREATE INDEX IF NOT EXISTS idx_sessions_id_active
    ON public.sessions (id, is_active)
    WHERE is_active = true;

-- ── oauth_states: expiry cleanup ──────────────────────────────────────────
-- Speeds up expired-state cleanup and lookups.
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at
    ON public.oauth_states (expires_at);

-- ── comments: post + time ─────────────────────────────────────────────────
-- Powers comment listing ordered by creation time on the post detail page.
CREATE INDEX IF NOT EXISTS idx_comments_post_created
    ON public.comments (post_id, created_at ASC);

-- ── posts: duplicate-post check ───────────────────────────────────────────
-- Powers the content_hash deduplication check in POST /posts.
CREATE INDEX IF NOT EXISTS idx_posts_author_hash
    ON public.posts (author_id, content_hash)
    WHERE content_hash IS NOT NULL;
