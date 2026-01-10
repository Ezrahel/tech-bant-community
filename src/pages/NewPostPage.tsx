// New post page with Apple design philosophy
import React, { useState, useRef, DragEvent } from 'react';
import { X, ChevronDown, Image, Film, Upload, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postsService } from '../services/posts';
import { useAuth } from '../contexts/AuthContext';

const postCategories = [
  { id: 'general', name: 'General', description: 'General discussions' },
  { id: 'tech', name: 'Tech', description: 'Technology topics' },
  { id: 'reviews', name: 'Reviews', description: 'Product reviews' },
  { id: 'updates', name: 'Updates', description: 'Updates and news' },
  { id: 'gists', name: 'Gists', description: 'Code snippets' },
  { id: 'banter', name: 'Banter', description: 'Casual conversations' },
];

const NewPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<Array<{ id: string; url: string; type: string; name: string }>>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      general: 'text-gray-400',
      tech: 'text-blue-400',
      reviews: 'text-purple-400',
      updates: 'text-green-400',
      gists: 'text-orange-400',
      banter: 'text-pink-400',
    };
    return colors[cat] || colors.general;
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const fileArray = Array.from(files).slice(0, 10 - media.length);
      
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        const uploaded = await postsService.uploadMedia(file, (progress) => {
          // Progress callback
        });

        setMedia((prev) => [
          ...prev,
          {
            id: uploaded.id,
            url: uploaded.url,
            type: uploaded.type,
            name: uploaded.name,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.length > 200) {
      setError('Title is required and must be less than 200 characters');
      return;
    }

    if (!content.trim() || content.length > 10000) {
      setError('Content is required and must be less than 10000 characters');
      return;
    }

    if (tags.length > 10) {
      setError('Maximum 10 tags allowed');
      return;
    }

    setIsPosting(true);

    try {
      await postsService.createPost({
        title: title.trim(),
        content: content.trim(),
        category: category as any,
        tags,
        location: location || undefined,
        mediaIds: media.map((m) => m.id),
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">Create Post</h1>
            <button
              type="submit"
              disabled={isPosting || uploading || !title.trim() || !content.trim()}
              className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish</span>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Author Info */}
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-800">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">
                  {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{userProfile?.name || 'User'}</p>
              <p className="text-xs text-gray-400">Posting as yourself</p>
            </div>
          </div>

          {/* Category Selector */}
          <div className="relative mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white hover:bg-gray-800 transition-colors"
            >
              <span className={getCategoryColor(category)}>
                {postCategories.find((c) => c.id === category)?.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showCategoryDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showCategoryDropdown && (
              <>
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-apple-lg z-50 overflow-hidden">
                  {postCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        category === cat.id
                          ? 'bg-gray-800/50 text-white'
                          : 'text-gray-300 hover:bg-gray-800/30'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${getCategoryColor(cat.id)}`}>
                          {cat.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>
                      </div>
                      {category === cat.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCategoryDropdown(false)}
                />
              </>
            )}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your post about?"
              maxLength={200}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={12}
              maxLength={10000}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{content.length}/10000</p>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
              Tags ({tags.length}/10)
            </label>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags and press Enter"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-2 bg-gray-800/50 text-gray-300 px-3 py-1.5 rounded-lg text-sm"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
              Location (optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Media Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            {media.length === 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Drop files here or click to upload</p>
                  <p className="text-gray-400 text-sm">
                    Images, videos (max 10MB each, up to 10 files)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-800 text-white px-6 py-2.5 rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Select Files
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="relative group">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-800 rounded-xl flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setMedia(media.filter((m) => m.id !== item.id))}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Add more files ({media.length}/10)
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewPostPage;
