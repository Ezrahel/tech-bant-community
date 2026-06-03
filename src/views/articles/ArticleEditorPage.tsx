import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import TipTapEditor from '../../components/editor/TipTapEditor';
import SeoFields from '../../components/editor/SeoFields';
import { articlesService } from '../../services/articles';
import { ArticleCategory, CreateArticleData } from '../../types';
import { useAutoSave } from '../../hooks/useAutoSave';

type PreviewMode = 'mobile' | 'tablet' | 'desktop';

const ArticleEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [jsonContent, setJsonContent] = useState<Record<string, unknown>>({});
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageCaption, setFeaturedImageCaption] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [showSeo, setShowSeo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    articlesService.getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const articleId = id!;
    setLoading(true);
    articlesService.getArticle(articleId)
      .then((article) => {
        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt || '');
        setHtmlContent(article.html_content || '');
        setJsonContent(article.content || {});
        setFeaturedImage(article.featured_image || '');
        setFeaturedImageCaption(article.featured_image_caption || '');
        setCategoryId(article.category_id || '');
        setTagsStr((article.tags || []).map((t) => t.tag).join(', '));
        setStatus(article.status);
        setScheduledAt(article.scheduled_at || '');
        setMetaTitle(article.meta_title || '');
        setMetaDescription(article.meta_description || '');
        setOgImage(article.og_image || '');
        setCanonicalUrl(article.canonical_url || '');
      })
      .catch(() => toast.error('Failed to load article'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  // Auto-generate slug from title
  const generateSlug = useCallback((t: string) => {
    return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slug) {
      setSlug(generateSlug(val));
    }
  };

  const articleData = useMemo(() => ({
    title,
    content: jsonContent,
    html_content: htmlContent,
    excerpt,
    featured_image: featuredImage,
    featured_image_caption: featuredImageCaption,
    category_id: categoryId,
    tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
    status,
    scheduled_at: scheduledAt || undefined,
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_image: ogImage,
    canonical_url: canonicalUrl,
  } as CreateArticleData), [title, jsonContent, htmlContent, excerpt, featuredImage, featuredImageCaption, categoryId, tagsStr, status, scheduledAt, metaTitle, metaDescription, ogImage, canonicalUrl]);

  const saveArticle = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        await articlesService.updateArticle(id!, articleData);
      } else {
        const article = await articlesService.createArticle(articleData);
        navigate(`/admin/articles/${article.id}/edit`, { replace: true });
      }
      toast.success('Article saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  }, [title, articleData, isEditing, id, navigate]);

  useAutoSave({
    data: articleData as unknown as Record<string, unknown>,
    onSave: saveArticle,
    interval: 30000,
    enabled: !!title,
    key: id || 'new',
  });

  const handlePublish = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await articlesService.updateArticle(id!, { ...articleData, status: 'published', change_summary: 'Published' });
      } else {
        const article = await articlesService.createArticle({ ...articleData, status: 'published' });
        navigate(`/admin/articles/${article.id}/edit`, { replace: true });
      }
      toast.success('Article published');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const handleSeoChange = (field: string, value: string) => {
    switch (field) {
      case 'slug': setSlug(value); break;
      case 'meta_title': setMetaTitle(value); break;
      case 'meta_description': setMetaDescription(value); break;
      case 'og_image': setOgImage(value); break;
      case 'canonical_url': setCanonicalUrl(value); break;
    }
  };

  const previewWidth = previewMode === 'mobile' ? 'w-[375px]' : previewMode === 'tablet' ? 'w-[768px]' : 'w-full';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/articles')}
              className="text-gray-400 hover:text-white text-sm"
            >
              &larr; Back
            </button>
            <span className="text-white/30 text-sm">|</span>
            <span className="text-sm text-white/60">{isEditing ? 'Edit Article' : 'New Article'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${showPreview ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setShowSeo(!showSeo)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${showSeo ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
            >
              SEO
            </button>
            <button
              onClick={saveArticle}
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-xs rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main editor */}
        <div className={`flex-1 min-w-0 ${showPreview ? 'max-w-[60%]' : ''}`}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600 mb-4"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief excerpt / summary..."
            className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-600 resize-none mb-4 focus:border-white/30 focus:outline-none"
            rows={2}
          />

          {/* Meta fields row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white cursor-pointer"
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Tags (comma separated)"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 flex-1 min-w-[200px] focus:border-white/30 focus:outline-none"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'scheduled' | 'published')}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>

            {status === 'scheduled' && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:border-white/30 focus:outline-none"
              />
            )}
          </div>

          {/* Featured Image */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Featured image URL"
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-white/30 focus:outline-none"
            />
            {featuredImage && (
              <input
                type="text"
                value={featuredImageCaption}
                onChange={(e) => setFeaturedImageCaption(e.target.value)}
                placeholder="Caption"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-white/30 focus:outline-none"
              />
            )}
          </div>

          {/* Rich Text Editor */}
          <TipTapEditor
            content={htmlContent}
            onChange={(html, json) => {
              setHtmlContent(html);
              setJsonContent(json);
            }}
            placeholder="Start writing..."
          />
        </div>

        {/* SEO Sidebar */}
        {showSeo && (
          <div className="w-80 flex-shrink-0">
            <SeoFields
              slug={slug}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              ogImage={ogImage}
              canonicalUrl={canonicalUrl}
              onChange={handleSeoChange}
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-40 bg-black/90 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-black/80 border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['mobile', 'tablet', 'desktop'] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize ${
                    previewMode === mode ? 'bg-white/15 text-white border border-white/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-sm">
              Close
            </button>
          </div>
          <div className={`mx-auto ${previewWidth} transition-all`}>
            <div className="bg-white text-black p-8 my-8 rounded-lg min-h-[500px] shadow-2xl">
              {featuredImage && (
                <img src={featuredImage} alt={featuredImageCaption || ''} className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
              {excerpt && <p className="text-lg text-gray-600 mb-6">{excerpt}</p>}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditorPage;
