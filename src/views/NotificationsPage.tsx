import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Filter, MessageSquare, ShieldAlert, Sparkles, Star, UserPlus, Zap } from 'lucide-react';

type FilterType = 'all' | 'mentions' | 'replies' | 'system';

const filters: Array<{ id: FilterType; label: string }> = [
  { id: 'all', label: 'All Activity' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'replies', label: 'Replies' },
  { id: 'system', label: 'System' },
];

const feed = [
  {
    id: '1',
    type: 'replies' as const,
    title: 'Three new replies landed on your camera comparison',
    description: 'People are debating low-light processing and asking for sample shots from the ultrawide lens.',
    time: '6 minutes ago',
    icon: MessageSquare,
  },
  {
    id: '2',
    type: 'mentions' as const,
    title: 'You were mentioned in a firmware rollout thread',
    description: 'A member asked if the battery regression you flagged is still present after the patch.',
    time: '21 minutes ago',
    icon: Bell,
  },
  {
    id: '3',
    type: 'system' as const,
    title: 'Your post was added to today’s community digest',
    description: 'The editorial queue pulled your write-up into the featured reading stack.',
    time: '1 hour ago',
    icon: Star,
  },
  {
    id: '4',
    type: 'system' as const,
    title: 'Moderation update on a report you submitted',
    description: 'A flagged thread was reviewed and resolved. You can revisit the report timeline from support.',
    time: '3 hours ago',
    icon: ShieldAlert,
  },
  {
    id: '5',
    type: 'mentions' as const,
    title: 'A new follower bookmarked your review archive',
    description: 'Your profile continues to pull attention from readers following the audio and accessories category.',
    time: 'Today',
    icon: UserPlus,
  },
];

const NotificationsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [readItems, setReadItems] = useState<string[]>([]);

  const visibleFeed = activeFilter === 'all'
    ? feed
    : feed.filter((item) => item.type === activeFilter);

  const unreadCount = useMemo(
    () => feed.filter((item) => !readItems.includes(item.id)).length,
    [readItems]
  );

  const toggleRead = (id: string) => {
    setReadItems((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const markAllRead = () => {
    setReadItems(feed.map((item) => item.id));
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel dot-noise overflow-hidden rounded-[2.2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/55">
              <Bell className="h-3.5 w-3.5" />
              Activity Center
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Notifications</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
              Replies, mentions, follows, moderation updates, and digest signals in one stream.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="surface-subtle rounded-[1.4rem] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Unread now</div>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">{unreadCount}</div>
              </div>
              <div className="surface-subtle rounded-[1.4rem] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Priority lane</div>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">04</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? 'bg-white text-black'
                  : 'border border-white/10 bg-white/[0.04] text-white/72 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {visibleFeed.map((item) => {
            const Icon = item.icon;
            const isRead = readItems.includes(item.id);
            return (
              <article
                key={item.id}
                className={`rounded-[1.75rem] p-5 transition-all hover:bg-white/[0.05] ${
                  isRead ? 'surface-subtle' : 'surface-panel'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="surface-subtle flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/30">
                    <Icon className="h-5 w-5 text-white/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {!isRead && <span className="h-2 w-2 rounded-full bg-white" />}
                          <h2 className="text-base font-semibold text-white">{item.title}</h2>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.18em] text-white/35">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/58">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/36">
                        <Sparkles className="h-3.5 w-3.5" />
                        {item.type}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRead(item.id)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/72 transition-all hover:bg-white/[0.08] hover:text-white"
                      >
                        {isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="surface-panel rounded-[1.75rem] p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/35">
              <Filter className="h-3.5 w-3.5" />
              Notification Rules
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Mentions', 'Instant'],
                ['Replies to your posts', 'Priority'],
                ['Featured digest', 'Daily'],
                ['Moderation updates', 'Always'],
              ].map(([label, value]) => (
                <div key={label} className="surface-subtle flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm text-white">{label}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/38">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[1.75rem] p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/35">
              <Zap className="h-3.5 w-3.5" />
              Digest Pulse
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/58">
              <p className="surface-subtle rounded-2xl p-4">
                Your posts gained 148 new views this week, led by the Ear comparison thread.
              </p>
              <p className="surface-subtle rounded-2xl p-4">
                Best time to post lately: 7:00 PM to 9:00 PM local time, when reply depth is strongest.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotificationsPage;
