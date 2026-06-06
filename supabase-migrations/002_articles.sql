-- Article Management Schema
-- Run in Supabase SQL Editor after the main schema (001)

-- Article categories
CREATE TABLE IF NOT EXISTS public.article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    html_content TEXT,
    featured_image TEXT,
    featured_image_caption TEXT,
    category_id UUID REFERENCES public.article_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- SEO fields
    meta_title TEXT,
    meta_description TEXT,
    og_image TEXT,
    canonical_url TEXT,

    -- Metadata
    view_count INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0
);

-- Article revisions (full version history)
CREATE TABLE IF NOT EXISTS public.article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    html_content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    category_id UUID,
    editor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article tags
CREATE TABLE IF NOT EXISTS public.article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL,
    UNIQUE(article_id, tag)
);

-- Article images (tracking uploaded images for articles)
CREATE TABLE IF NOT EXISTS public.article_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt TEXT,
    caption TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status_scheduled ON public.articles(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_article_revisions_article ON public.article_revisions(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON public.article_tags(tag);
CREATE INDEX IF NOT EXISTS idx_article_images_article ON public.article_images(article_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO public.article_categories (name, slug, description) VALUES
    ('News', 'news', 'Latest tech news and announcements'),
    ('Reviews', 'reviews', 'In-depth product reviews'),
    ('Tutorials', 'tutorials', 'How-to guides and tutorials'),
    ('Opinion', 'opinion', 'Opinion pieces and editorials'),
    ('Research', 'research', 'Research and analysis')
ON CONFLICT (slug) DO NOTHING;

-- Create storage bucket for images (also auto-created on first upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;
