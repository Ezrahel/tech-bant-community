import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articlesService } from '../../services/articles';
import { Article } from '../../types';

const ArticleViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    articlesService.getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err instanceof Error ? err.message : 'Article not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">{error || 'Article not found'}</p>
          <button onClick={() => navigate('/')} className="text-blue-400 text-sm hover:underline">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 text-sm hover:text-white mb-8 inline-flex items-center gap-1"
        >
          &larr; Back
        </button>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={article.featured_image}
              alt={article.featured_image_caption || article.title}
              className="w-full h-full object-cover"
            />
            {article.featured_image_caption && (
              <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-xs text-gray-300">
                {article.featured_image_caption}
              </p>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {article.category && (
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                {article.category.name}
              </span>
            )}
            <span className="text-[10px] text-gray-500">{formatDate(article.published_at || article.created_at)}</span>
            <span className="text-[10px] text-gray-500">{article.reading_time_minutes} min read</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-gray-400 leading-relaxed">{article.excerpt}</p>
          )}

          {/* Author */}
          {article.author && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-white font-medium">{article.author.name}</p>
                <p className="text-xs text-gray-500">{article.author.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-gray-300 prose-p:leading-8
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-green-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10
            prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400
            prose-img:rounded-xl
            prose-hr:border-white/10"
          dangerouslySetInnerHTML={{ __html: article.html_content || '' }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <span key={t.tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  #{t.tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleViewPage;
