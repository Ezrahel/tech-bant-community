import React, { useState, useRef } from 'react';
import { X, ChevronDown, Image, Film, Upload, Smile, Calendar, MapPin, Play, FileImage } from 'lucide-react';
import { PageType, PostCategory, MediaAttachment } from '../types';
import { postsService } from '../services/posts';

interface NewPostPageProps {
  setCurrentPage: (page: PageType) => void;
  postCategories: PostCategory[];
}

const NewPostPage: React.FC<NewPostPageProps> = ({ setCurrentPage, postCategories }) => {
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('general');
  const [postTags, setPostTags] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<MediaAttachment[]>([]);
  const [location, setLocation] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreatePost = () => {
    const postData = {
      title: postTitle,
      content: postContent,
      category: postCategory as PostCategory,
      tags: postTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      location,
      mediaIds: attachedMedia.map(media => media.id)
    };

    postsService.createPost(postData)
      .then(() => {
        // Reset form and redirect
        setPostTitle('');
        setPostContent('');
        setPostCategory('general');
        setPostTags('');
        setAttachedMedia([]);
        setLocation('');
        setCurrentPage('home');
      })
      .catch((error) => {
        console.error('Failed to create post:', error);
        alert('Failed to create post. Please try again.');
      });
  };

  const handleFileUpload = (type: 'image' | 'video' | 'gif', files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const validTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        gif: ['image/gif']
      };

      if (!validTypes[type].includes(file.type)) {
        alert(`Please select a valid ${type} file.`);
        return;
      }


      // Upload to Appwrite
      postsService.uploadMedia(file)
        .then((uploadedMedia) => {
          const newMedia: MediaAttachment = {
            id: uploadedMedia.id,
            type: uploadedMedia.type as 'image' | 'video' | 'gif',
            url: uploadedMedia.url,
            name: uploadedMedia.name,
            size: uploadedMedia.size
          };
          
          setAttachedMedia(prev => [...prev, newMedia]);
        })
        .catch((error) => {
          console.error('Failed to upload media:', error);
          alert('Failed to upload media. Please try again.');
        });
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button 
            onClick={() => setCurrentPage('home')}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button 
            onClick={handleCreatePost}
            disabled={!postTitle.trim() || !postContent.trim()}
            className="bg-white text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
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

              {/* Media Attachments */}
              {attachedMedia.length > 0 && (
                <div className="space-y-3">
                  {attachedMedia.map((media) => (
                    <div key={media.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                      {media.type === 'image' ? (
                        <div className="relative">
                          <img 
                            src={media.url} 
                            alt={media.name}
                            className="w-full h-48 object-cover"
                          />
                          <button
                            onClick={() => removeMedia(media.id)}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : media.type === 'video' ? (
                        <div className="relative">
                          <video 
                            src={media.url}
                            className="w-full h-48 object-cover"
                            controls
                          />
                          <button
                            onClick={() => removeMedia(media.id)}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-3">
                            <FileImage className="w-8 h-8 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-white">{media.name}</div>
                              <div className="text-xs text-gray-400">{formatFileSize(media.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeMedia(media.id)}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
    </div>
  );
};

export default NewPostPage;