import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCcw, Sparkles, Star, TrendingUp } from 'lucide-react';
import PostCard from '../components/PostCard';
import { postsService } from '../services/posts';
import { Post } from '../types';

interface CommunityFeedPageProps {
  mode: 'discussions' | 'reviews';
}

const pageContent = {
  discussions: {
    icon: MessageSquare,
    title: 'Discussions',
    description: 'Community conversations, launch reactions, setup notes, and the sharper side of product talk.',
    statLabel: 'Open threads',
    statValue: '148',
    subStatLabel: 'New today',
    subStatValue: '27',
  },
  reviews: {
    icon: Star,
    title: 'Reviews',
    description: 'Long-form breakdowns, comparisons, buying opinions, and device impressions from the community.',
    statLabel: 'Fresh reviews',
    statValue: '39',
    subStatLabel: 'Featured now',
    subStatValue: '08',
  },
} as const;

const CommunityFeedPage: React.FC<CommunityFeedPageProps> = ({ mode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const content = pageContent[mode];
  const Icon = content.icon;

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = mode === 'reviews'
        ? await postsService.getPosts({ category: 'reviews' })
        : await postsService.getPosts();

      const filteredPosts = mode === 'reviews'
        ? response
        : response.filter((post) => post.category !== 'reviews');

      setPosts(filteredPosts.map((post) => postsService.convertToPost(post)));
    } catch (err: any) {
      console.error(`Failed to load ${mode}:`, err);
      setError(err.message || `Failed to load ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [mode]);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-5xl px-0 py-1">
        <section className="surface-panel dot-noise overflow-hidden rounded-[2.2rem] p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/55">
                <Icon className="h-3.5 w-3.5" />
                Community Feed
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                {content.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                {content.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="surface-subtle rounded-[1.4rem] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{content.statLabel}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">{content.statValue}</div>
                </div>
                <div className="surface-subtle rounded-[1.4rem] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{content.subStatLabel}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">{content.subStatValue}</div>
                </div>
                <div className="surface-subtle flex items-center gap-3 rounded-[1.4rem] px-4 py-3 text-sm text-white/72">
                  <TrendingUp className="h-4 w-4" />
                  High signal this evening
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => void loadPosts()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <div className="surface-subtle rounded-[1.4rem] px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  <Sparkles className="h-3.5 w-3.5" />
                  Editorial cue
                </div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {mode === 'reviews'
                    ? 'Lead with the product, the use period, and the tradeoff that mattered most.'
                    : 'Posts that open with a clear opinion tend to pull better replies.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 sm:mt-6">
          {loading ? (
            <div className="surface-panel flex min-h-[280px] items-center justify-center rounded-[2rem]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <p className="text-sm text-white/55">Loading posts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="surface-panel rounded-[2rem] p-10 text-center">
              <p className="text-sm text-white/55">
                No posts available in this section yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CommunityFeedPage;
