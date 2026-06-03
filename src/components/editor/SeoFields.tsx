import React from 'react';

interface SeoFieldsProps {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  slug: string;
  onChange: (field: string, value: string) => void;
}

const SeoFields: React.FC<SeoFieldsProps> = ({
  metaTitle,
  metaDescription,
  ogImage,
  canonicalUrl,
  slug,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-black/20">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">SEO Settings</h3>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => onChange('slug', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-white/30 focus:outline-none"
          placeholder="article-url-slug"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Meta Title</label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onChange('meta_title', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-white/30 focus:outline-none"
          placeholder="SEO title (optional)"
          maxLength={200}
        />
        <span className="text-[10px] text-gray-500 mt-1">{metaTitle.length}/200</span>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Meta Description</label>
        <textarea
          value={metaDescription}
          onChange={(e) => onChange('meta_description', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-white/30 focus:outline-none resize-none"
          placeholder="SEO description (optional)"
          maxLength={300}
          rows={3}
        />
        <span className="text-[10px] text-gray-500 mt-1">{metaDescription.length}/300</span>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Open Graph Image URL</label>
        <input
          type="url"
          value={ogImage}
          onChange={(e) => onChange('og_image', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-white/30 focus:outline-none"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Canonical URL</label>
        <input
          type="url"
          value={canonicalUrl}
          onChange={(e) => onChange('canonical_url', e.target.value)}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-white/30 focus:outline-none"
          placeholder="https://example.com/original-article"
        />
      </div>
    </div>
  );
};

export default SeoFields;
