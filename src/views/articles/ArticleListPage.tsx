import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { articlesService } from '../../services/articles';
import { Article } from '../../types';

const ArticleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const loadArticles = async (status?: string) => {
    setLoading(true);
    try {
      const data = await articlesService.getArticles({ status, limit: 50 });
      setArticles(data);
    } catch {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleFilter = (status: string) => {
    setFilter(status);
    loadArticles(status || undefined);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await articlesService.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success('Article deleted');
    } catch {
      toast.error('Failed to delete article');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const result = await articlesService.togglePublish(id);
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: result.status as Article['status'] } : a))
      );
      toast.success(result.message);
    } catch {
      toast.error('Failed to toggle publish status');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      published: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Articles</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your articles and blog posts</p>
          </div>
          <button
            onClick={() => navigate('/admin/articles/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
          >
            New Article
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {['', 'draft', 'scheduled', 'published'].map((s) => (
            <button
              key={s}
              onClick={() => handleFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border capitalize ${
                filter === s
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No articles found</p>
            <button
              onClick={() => navigate('/admin/articles/new')}
              className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20"
            >
              Create your first article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Author</th>
                  <th className="py-3 pr-4">Views</th>
                  <th className="py-3 pr-4">Updated</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4">
                      <div className="text-white font-medium truncate max-w-[300px]">{article.title}</div>
                      {article.excerpt && (
                        <div className="text-gray-500 text-[10px] truncate max-w-[300px] mt-0.5">{article.excerpt}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(article.status)}</td>
                    <td className="py-3 pr-4 text-gray-400">{article.author?.name || 'Unknown'}</td>
                    <td className="py-3 pr-4 text-gray-400">{article.view_count}</td>
                    <td className="py-3 pr-4 text-gray-400 text-[10px]">
                      {new Date(article.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                          className="px-2 py-1 text-[10px] rounded border border-white/10 text-gray-400 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublish(article.id)}
                          className="px-2 py-1 text-[10px] rounded border border-white/10 text-gray-400 hover:text-white"
                        >
                          {article.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          className="px-2 py-1 text-[10px] rounded border border-red-500/20 text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleListPage;
