import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Compass,
  Flame,
  HelpCircle,
  LogIn,
  MessageSquare,
  PenSquare,
  Sparkles,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MobilePullToRefresh from './MobilePullToRefresh';

interface ProtectedPageShellProps {
  children: React.ReactNode;
}

const trendingTopics = ['camera tuning', 'Nothing OS 3', 'Ear EQ presets', 'Phone accessories'];
const watchList = [
  { label: 'Launch Watch', value: '3 live', detail: 'firmware rollouts and release chatter' },
  { label: 'Saved Reads', value: '12', detail: 'threads worth revisiting later' },
  { label: 'Reply Queue', value: '7', detail: 'conversations waiting for your take' },
];
const notificationPreview = [
  { title: 'New replies on your review draft', time: '8m ago' },
  { title: 'A moderator featured a discussion you joined', time: '24m ago' },
  { title: 'Community digest is ready for tonight', time: '1h ago' },
];

const pageMeta: Record<string, { label: string; kicker: string; note: string }> = {
  '/discussions': {
    label: 'Discussions',
    kicker: 'Open threads',
    note: 'Fast-moving conversations, sharper replies, better signal.',
  },
  '/reviews': {
    label: 'Reviews',
    kicker: 'Long-form takes',
    note: 'Comparisons, buying opinions, deep impressions, and post-purchase reality.',
  },
  '/profile': {
    label: 'Profile',
    kicker: 'Identity layer',
    note: 'Your posts, reputation, saved context, and account controls.',
  },
  '/notifications': {
    label: 'Notifications',
    kicker: 'Activity pulse',
    note: 'Track replies, follows, mentions, moderation events, and saved alerts.',
  },
  '/support': {
    label: 'Support',
    kicker: 'Help desk',
    note: 'Account help, bug reports, and product feedback routed cleanly.',
  },
  '/new-post': {
    label: 'Compose',
    kicker: 'Draft zone',
    note: 'Write with intent, choose the right category, publish when it is ready.',
  },
};

function getPageDetails(pathname: string) {
  if (pathname.startsWith('/posts/')) {
    return {
      label: 'Post Thread',
      kicker: 'Deep dive',
      note: 'Read the full post, follow the comment chain, and jump into the thread.',
    };
  }

  if (pathname.startsWith('/profile')) {
    return pageMeta['/profile'];
  }

  return pageMeta[pathname] || {
    label: 'Community',
    kicker: 'Workspace',
    note: 'Navigation, context, and tools that stay visible while you browse.',
  };
}

const ProtectedPageShell: React.FC<ProtectedPageShellProps> = ({ children }) => {
  const location = useLocation();
  const { userProfile, isAuthenticated } = useAuth();
  const profileStats = userProfile as (typeof userProfile & {
    posts_count?: number;
    followers_count?: number;
    following_count?: number;
  }) | null;
  const details = getPageDetails(location.pathname);

  const primaryLinks = isAuthenticated
    ? [
        { to: '/discussions', label: 'Discussions', icon: MessageSquare },
        { to: '/reviews', label: 'Reviews', icon: Star },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/support', label: 'Support', icon: HelpCircle },
        { to: '/profile', label: 'Profile', icon: UserCircle2 },
      ]
    : [
        { to: '/discussions', label: 'Discussions', icon: MessageSquare },
        { to: '/reviews', label: 'Reviews', icon: Star },
        { to: '/support', label: 'Support', icon: HelpCircle },
      ];

  const quickLinks = isAuthenticated
    ? [
        { to: '/new-post', label: 'New Post', icon: PenSquare },
        { to: '/profile?tab=settings', label: 'Settings', icon: ShieldCheck },
        { to: '/reviews', label: 'Saved Reviews', icon: Bookmark },
      ]
    : [
        { to: '/login', label: 'Sign In', icon: LogIn },
        { to: '/signup', label: 'Create Account', icon: Sparkles },
        { to: '/reviews', label: 'Browse Reviews', icon: Bookmark },
      ];

  const isActive = (to: string) => {
    if (to === '/profile') return location.pathname.startsWith('/profile');
    return location.pathname === to;
  };

  return (
    <MobilePullToRefresh>
      <div className="shell-grid mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-6 lg:px-8">
        <div className="xl:hidden space-y-4 mb-5">
          <div className="surface-panel dot-noise overflow-hidden rounded-[1.75rem] p-4">
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">{details.kicker}</div>
                <div className="mt-2 truncate text-xl font-semibold tracking-[-0.04em] text-white">{details.label}</div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {isAuthenticated
                    ? details.note
                    : `${details.note} Visitors can read and share, while posting and reactions stay locked behind sign-in.`}
                </p>
              </div>
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="h-12 w-12 rounded-[1.15rem] object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-white/10">
                  <UserCircle2 className="h-6 w-6 text-white/65" />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {primaryLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-white text-black'
                      : 'border border-white/10 bg-white/[0.03] text-white/72'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="surface-panel rounded-[1.2rem] p-3 text-center min-w-0">
              <div className="text-lg font-semibold text-white">{profileStats?.posts_count || 0}</div>
              <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.1em] text-white/40">POSTS</div>
            </div>
            <div className="surface-panel rounded-[1.2rem] p-3 text-center min-w-0">
              <div className="text-lg font-semibold text-white">{profileStats?.followers_count || 0}</div>
              <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.08em] text-white/40">FOLLOWERS</div>
            </div>
            <div className="surface-panel rounded-[1.2rem] p-3 text-center min-w-0">
              <div className="text-lg font-semibold text-white">{profileStats?.following_count || 0}</div>
              <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.08em] text-white/40">FOLLOWING</div>
            </div>
          </div>
        </div>

        <div className="xl:grid xl:grid-cols-[292px_minmax(0,1fr)_332px] xl:gap-6">
          <aside className="hidden space-y-6 xl:sticky xl:top-24 xl:block xl:self-start">
          <div className="surface-panel dot-noise overflow-hidden rounded-[2rem] p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                  {isAuthenticated ? 'Signed in as' : 'Visitor mode'}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                  <Sparkles className="h-3 w-3" />
                  {isAuthenticated ? 'Live' : 'Read only'}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="h-14 w-14 rounded-[1.25rem] object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/10">
                  <UserCircle2 className="h-6 w-6 text-white/65" />
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-[-0.02em] text-white">
                  {userProfile?.name || 'Community Visitor'}
                </div>
                <div className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-white/38">
                  {userProfile?.role?.replace('_', ' ') || 'guest'}
                </div>
              </div>
            </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="surface-subtle min-w-0 rounded-[1.35rem] p-3 text-center">
                  <div className="text-lg font-semibold text-white">{profileStats?.posts_count || 0}</div>
                  <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.1em] text-white/35">POSTS</div>
                </div>
                <div className="surface-subtle min-w-0 rounded-[1.35rem] p-3 text-center">
                  <div className="text-lg font-semibold text-white">{profileStats?.followers_count || 0}</div>
                  <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.08em] text-white/35">FOLLOWERS</div>
                </div>
                <div className="surface-subtle min-w-0 rounded-[1.35rem] p-3 text-center">
                  <div className="text-lg font-semibold text-white">{profileStats?.following_count || 0}</div>
                  <div className="mt-1 flex min-h-[1.5rem] items-center justify-center text-[9px] leading-3 tracking-[0.08em] text-white/35">FOLLOWING</div>
                </div>
              </div>
              {!isAuthenticated && (
                <Link
                  to="/signup"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-neutral-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Join To Interact
                </Link>
              )}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-4">
            <div className="px-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Navigate</div>
            <nav className="mt-3 space-y-2">
              {primaryLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center justify-between rounded-[1.35rem] px-4 py-3 text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]'
                      : 'surface-subtle text-white/72 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <Compass className={`h-4 w-4 transition-transform ${isActive(to) ? 'text-black/60' : 'text-white/28 group-hover:translate-x-0.5'}`} />
                </Link>
              ))}
            </nav>
          </div>

          <div className="surface-panel rounded-[2rem] p-4">
            <div className="px-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Quick Actions</div>
            <div className="mt-3 space-y-2">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="surface-subtle flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-sm text-white/75 transition-all hover:bg-white/[0.06] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          </aside>

          <main className="min-w-0">{children}</main>

          <aside className="mt-6 hidden space-y-6 xl:sticky xl:top-24 xl:mt-0 xl:block xl:self-start">
          <div className="surface-panel dot-noise overflow-hidden rounded-[2rem] p-6">
            <div className="relative z-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">{details.kicker}</div>
            <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">{details.label}</h2>
            <p className="mt-3 text-sm leading-7 text-white/58">
              {isAuthenticated
                ? details.note
                : `${details.note} Read-only access stays open for visitors.`}
            </p>
            <div className="surface-subtle mt-5 rounded-[1.5rem] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-4 w-4" />
                Session Notes
              </div>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Keep moving through the community without losing context. The shell stays stable while the center panel changes.
              </p>
            </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
              <TrendingUp className="h-3.5 w-3.5" />
              Trending Topics
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/68"
                >
                  #{topic}
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {watchList.map((item) => (
                <div key={item.label} className="surface-subtle rounded-[1.25rem] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-white/36">{item.value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
              <Bell className="h-3.5 w-3.5" />
              Activity Preview
            </div>
            <div className="mt-4 space-y-3">
              {notificationPreview.map((item) => (
                <Link
                  key={item.title}
                  to={isAuthenticated ? '/notifications' : '/login'}
                  className="surface-subtle block rounded-[1.25rem] p-4 transition-all hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/36">{item.time}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
              <Flame className="h-3.5 w-3.5" />
              Editorial Tips
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/58">
              <p className="surface-subtle rounded-[1.25rem] p-4">
                Strong threads start with a clear claim, a concrete example, and one specific question.
              </p>
              <p className="surface-subtle rounded-[1.25rem] p-4">
                Reviews read better when setup details, use period, and tradeoffs are stated upfront.
              </p>
              <p className="surface-subtle rounded-[1.25rem] p-4">
                Use support for account issues, bugs, moderation concerns, and feature requests that need tracking.
              </p>
            </div>
          </div>
          </aside>
        </div>
      </div>
    </MobilePullToRefresh>
  );
};

export default ProtectedPageShell;
