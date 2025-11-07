import React, { useState, useRef, DragEvent } from 'react';
import { X, ChevronDown, Image, Film, Upload, Smile, Calendar, MapPin, Play, FileImage } from 'lucide-react';
import { PostCategory, MediaAttachment } from '../types';
import { postsService } from '../services/posts';
import { useNavigate } from 'react-router-dom';

interface NewPostPageProps {
  postCategories: PostCategory[];
}

const NewPostPage: React.FC<NewPostPageProps> = ({ postCategories }) => {
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState(postCategories[0]?.id || 'general');
  const [postTags, setPostTags] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<MediaAttachment[]>([]);
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'text-gray-400',
      tech: 'text-blue-400',
      reviews: 'text-purple-400',
      updates: 'text-green-400',
      gists: 'text-orange-400',
      banter: 'text-pink-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  const handleCreatePost = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!postTitle.trim() || !postContent.trim()) {
      setErrorMsg('Title and content are required.');
      return;
    }
    if (uploading) {
      setErrorMsg('Please wait for all uploads to finish.');
      return;
    }
    // Validate category
    const validCategory = postCategories.some(c => c.id === postCategory);
    if (!validCategory) {
      setErrorMsg('Please select a valid category.');
      return;
    }
    setIsPosting(true);
    try {
      const postData = {
        title: postTitle,
        content: postContent,
        category: postCategory as unknown as PostCategory,
        tags: postTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        location,
        mediaIds: attachedMedia.map(media => media.id)
      };
      await postsService.createPost(postData);
      setPostTitle('');
      setPostContent('');
      setPostCategory(postCategories[0]?.id || 'general');
      setPostTags('');
      setAttachedMedia([]);
      setLocation('');
      setSuccessMsg('Post created successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        navigate('/');
      }, 1200);
    } catch (error) {
      console.error('Failed to create post:', error);
      setErrorMsg('Failed to create post. Please ensure you are logged in and try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileUpload = (type: 'image' | 'video' | 'gif', files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrorMsg(null);
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/mov'],
      gif: ['image/gif']
    };
    Array.from(files).forEach(async (file) => {
      if (!validTypes[type].includes(file.type)) {
        setErrorMsg(`Please select a valid ${type} file.`);
        setUploading(false);
        return;
      }
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        // Simulate progress (Appwrite SDK does not provide progress natively)
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setUploadProgress(prev => ({ ...prev, [file.name]: Math.min(progress, 95) }));
        }, 200);
        const uploadedMedia = await postsService.uploadMedia(file);
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        setAttachedMedia(prev => [
          ...prev,
          {
            ...uploadedMedia,
            type: uploadedMedia.type as 'image' | 'video' | 'gif',
          }
        ]);
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [file.name]: _, ...rest } = prev;
            return rest;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to upload media:', error);
        setErrorMsg('Failed to upload media. Please try again.');
        setUploadProgress(prev => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });
      } finally {
        setUploading(false);
      }
    });
  };

  const removeMedia = (id: string) => {
    setAttachedMedia(prev => {
      const media = prev.find(m => m.id === id);
      if (media) {
        URL.revokeObjectURL(media.url);
      }
      return prev.filter(m => m.id !== id);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Drag-and-drop handlers for file upload
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Only allow images/videos/gifs
      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'image/gif'
      );
      if (files.length > 0) {
        // Guess type by first file
        const type = files[0].type.startsWith('image/') ? 'image' : files[0].type.startsWith('video/') ? 'video' : 'gif';
        handleFileUpload(type as 'image' | 'video' | 'gif', files as unknown as FileList);
      }
    }
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Drag-and-drop for reordering media
  const handleDragStartMedia = (index: number) => setDraggedIndex(index);
  const handleDropMedia = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setAttachedMedia(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, removed);
      return updated;
    });
    setDraggedIndex(null);
  };
  const handleDragEndMedia = () => setDraggedIndex(null);

  return (
    <div
      className={`max-w-2xl mx-auto ${dragOver ? 'ring-4 ring-blue-500' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button 
            onClick={handleCreatePost}
            disabled={!postTitle.trim() || !postContent.trim() || isPosting || uploading}
            className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex space-x-3">
            {/* Avatar */}
            <img 
              src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" 
              alt="Your avatar" 
              className="w-12 h-12 rounded-full flex-shrink-0"
            />
            
            {/* Form */}
            <div className="flex-1 space-y-4">
              {/* Category Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-full text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className={getCategoryColor(postCategory)}>
                    {postCategories.find(c => c.id === postCategory)?.name}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10">
                    {postCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setPostCategory(category.id);
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className={`font-medium ${getCategoryColor(category.id)}`}>
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {category.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="What's the title of your post?"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full text-xl font-semibold bg-transparent border-none outline-none placeholder-gray-500 resize-none"
              />

              {/* Content Textarea */}
              <textarea
                placeholder="What's happening in tech?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className="w-full text-lg bg-transparent border-none outline-none placeholder-gray-500 resize-none"
              />

              {/* Tags Input */}
              <input
                type="text"
                placeholder="Add tags (comma separated)"
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-500"
              />

              {/* Location Display */}
              {location && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                  <button 
                    onClick={() => setLocation('')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Media Previews with drag-and-drop reordering */}
              {attachedMedia.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  {attachedMedia.map((media, idx) => (
                    <div
                      key={media.id}
                      className={`relative group rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center aspect-square ${draggedIndex === idx ? 'ring-4 ring-blue-400' : ''}`}
                      draggable
                      onDragStart={() => handleDragStartMedia(idx)}
                      onDrop={() => handleDropMedia(idx)}
                      onDragEnd={handleDragEndMedia}
                      onDragOver={e => e.preventDefault()}
                    >
                      {media.type === 'image' && (
                        <img src={media.url} alt={media.name} className="object-cover w-full h-full" />
                      )}
                      {media.type === 'video' && (
                        <video src={media.url} controls className="object-cover w-full h-full" />
                      )}
                      {media.type === 'gif' && (
                        <img src={media.url} alt={media.name} className="object-cover w-full h-full" />
                      )}
                      <button
                        onClick={() => removeMedia(media.id)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 z-10"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {/* Drag handle icon (optional) */}
                      <div className="absolute bottom-2 left-2 text-xs text-gray-400 opacity-70 cursor-move select-none">⇅</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    title="Add image"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    title="Add video"
                  >
                    <Film className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => gifInputRef.current?.click()}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    title="Add GIF"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors">
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={getCurrentLocation}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    title="Add location"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  {postContent.length}/2000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload('image', e.target.files)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload('video', e.target.files)}
      />
      <input
        ref={gifInputRef}
        type="file"
        accept="image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload('gif', e.target.files)}
      />
      {errorMsg && (
        <div className="text-red-400 text-sm mb-2">{errorMsg}</div>
      )}
      {successMsg && (
        <div className="text-green-400 text-sm mb-2">{successMsg}</div>
      )}
      {uploading && (
        <div className="text-blue-400 text-sm mb-2">Uploading media...</div>
      )}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-2 space-y-1">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">{name}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">{progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewPostPage;