import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBolt,
  faChartLine,
  faCheckCircle,
  faCircle,
  faComment,
  faHeadphones,
  faLayerGroup,
  faMicrochip,
  faPlay,
  faShieldAlt,
  faStar,
  faUsers,
  faWaveSquare,
  faBoltLightning,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { categories, samplePosts } from '../data/sampleData';

const signalBlocks = [
  {
    title: 'Live Product Discourse',
    copy: 'Daily conversations around phones, audio, software drops, glyph experiments, setup rituals, and the culture around Nothing.',
    icon: faComment,
  },
  {
    title: 'Sharp Reviews',
    copy: 'Long-form device breakdowns, practical buying opinions, camera impressions, and community-tested accessories.',
    icon: faStar,
  },
  {
    title: 'Community Gists',
    copy: 'Short technical notes, tweaks, setup ideas, launch observations, and workflows shared by people actually using the ecosystem.',
    icon: faLayerGroup,
  },
];

const ecosystemPulse = [
  { label: 'Verified builders', value: '180+', detail: 'mods, reviewers, community leads' },
  { label: 'Weekly discussions', value: '1.2K', detail: 'signal over noise, curated by category' },
  { label: 'Active now', value: '847', detail: 'reading, reacting, posting in real time' },
  { label: 'Launch watchlists', value: '34', detail: 'product, firmware, audio, OS updates' },
];

const featureRows = [
  {
    eyebrow: 'Community System',
    title: 'A forum designed like a product surface.',
    copy: 'Nothing hardware feels deliberate, stripped back, and signal-first. The community layer follows that same rule: fewer distractions, heavier contrast, clearer hierarchy, stronger focus on what matters.',
    icon: faMicrochip,
    points: ['Structured discussions by category', 'Clean profile and moderation layers', 'Fast routes for reviews, updates, and gists'],
  },
  {
    eyebrow: 'Listening Culture',
    title: 'Built for people who care about details.',
    copy: 'From earbuds and tuning talk to camera processing and OS motion, the page surfaces the kind of granular discussion that generic tech communities usually flatten.',
    icon: faHeadphones,
    points: ['Review-led conversations', 'Opinion pieces with debate context', 'Product snapshots and release notes'],
  },
  {
    eyebrow: 'Signal Stack',
    title: 'Conversation, but with discipline.',
    copy: 'Reports, admin tooling, category flows, profile controls, and media handling are all organized to support a community that can actually scale without turning messy.',
    icon: faShieldAlt,
    points: ['Moderation-aware posting model', 'Category-driven discovery', 'Profile, bookmark, and follow flows'],
  },
];

const launchTimeline = [
  { label: 'Join', detail: 'Create a profile, pick the corners of the ecosystem you care about, and set your voice.' },
  { label: 'Track', detail: 'Follow updates, reviews, and discussions as launches, firmware drops, and community reactions roll in.' },
  { label: 'Contribute', detail: 'Post reviews, ask sharper questions, share setup notes, and shape the quality bar of the space.' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const primaryCTA = isAuthenticated
    ? { label: 'Enter Community', action: () => navigate('/discussions') }
    : { label: 'Join Community', action: () => navigate('/signup') };

  const secondaryCTA = isAuthenticated
    ? { label: 'Write a Post', action: () => navigate('/new-post') }
    : { label: 'Sign In', action: () => navigate('/login') };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.07),transparent_22%),linear-gradient(180deg,#0a0a0a_0%,#000_45%,#050505_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-10 items-start">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-white/70">
                <FontAwesomeIcon icon={faCircle} className="w-2 h-2 text-white" />
                Nothing Community
              </div>

              <h1 className="mt-8 text-[3rem] leading-[0.92] sm:text-[4.8rem] lg:text-[6.8rem] font-semibold tracking-[-0.06em] text-balance">
                Signal for the people building,
                <span className="block text-white/45">testing, and living inside the Nothing ecosystem.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base sm:text-lg leading-7 text-white/72">
                A focused home for product discussions, firmware reactions, audio debates, camera notes, buying opinions,
                community reviews, and the sharp side of Nothing culture. Less clutter. Better taste. Stronger conversation.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={primaryCTA.action}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
                >
                  <span>{primaryCTA.label}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </button>
                <button
                  onClick={secondaryCTA.action}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  <FontAwesomeIcon icon={faPlay} className="w-4 h-4" />
                  <span>{secondaryCTA.label}</span>
                </button>
              </div>

              <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {ecosystemPulse.map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <div className="text-2xl sm:text-3xl font-semibold tracking-[-0.05em]">{item.value}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/45">{item.label}</div>
                    <div className="mt-3 text-sm leading-6 text-white/62">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative xl:pt-8">
              <div className="absolute -top-10 right-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-[#0d0d0d]/90 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">Landing Feed</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.05em]">What the community is watching</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <FontAwesomeIcon icon={faBoltLightning} className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {samplePosts.slice(0, 3).map((post, index) => (
                    <div
                      key={post.id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">Feature {index + 1}</div>
                        <div className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-white/55">
                          {post.category}
                        </div>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold leading-6 tracking-[-0.04em]">{post.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/62">{post.content}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-white/45">
                        <span>{post.author.name}</span>
                        <span>{post.comments} comments</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                    <FontAwesomeIcon icon={faWaveSquare} className="w-4 h-4 text-white/55" />
                    <div className="mt-3 text-xl font-semibold tracking-[-0.05em]">2.5</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/35">OS Pulse</div>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                    <FontAwesomeIcon icon={faBolt} className="w-4 h-4 text-white/55" />
                    <div className="mt-3 text-xl font-semibold tracking-[-0.05em]">64h</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/35">Launch Window</div>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-white/55" />
                    <div className="mt-3 text-xl font-semibold tracking-[-0.05em]">24.7K</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/35">Community</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/8 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/38">Core Blocks</div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-[-0.05em] text-balance">
              A landing page that behaves like a community console.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/62">
              The visual language stays close to Nothing: monochrome surfaces, stark contrast, rounded industrial cards,
              dot-grid texture, oversized type, and intentional whitespace. The information architecture stays close to community:
              discover, compare, react, and contribute.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {signalBlocks.map((block) => (
              <div key={block.title} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <FontAwesomeIcon icon={block.icon} className="w-5 h-5 text-white/72" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em]">{block.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{block.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
          {featureRows.map((row, index) => (
            <div
              key={row.title}
              className={`grid grid-cols-1 xl:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'xl:[&>*:first-child]:order-2' : ''}`}
            >
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 sm:p-9">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">{row.eyebrow}</div>
                <h3 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-[-0.055em] text-balance">{row.title}</h3>
                <p className="mt-5 text-base leading-7 text-white/62">{row.copy}</p>
                <div className="mt-8 space-y-4">
                  {row.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-white/72">
                      <FontAwesomeIcon icon={faCheckCircle} className="mt-1 w-4 h-4 text-white/85" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[340px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="absolute -top-16 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <FontAwesomeIcon icon={row.icon} className="w-6 h-6 text-white/80" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {ecosystemPulse.slice(index, index + 2).map((item) => (
                      <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-black/40 p-4">
                        <div className="text-2xl font-semibold tracking-[-0.05em]">{item.value}</div>
                        <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/35">{item.label}</div>
                        <div className="mt-3 text-sm leading-6 text-white/58">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/8 bg-[#040404]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">Categories</div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-[-0.05em]">Every layer of the ecosystem, separated cleanly.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              The landing page surfaces exactly what this community is for: practical reviews, deeper tech talk, fast update tracking,
              lighter banter, and quick gists when insight does not need a full essay.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.filter((category) => category.id !== 'all').map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(category.id === 'reviews' ? '/reviews' : '/discussions')}
                className="group rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:bg-white/[0.06] hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/38">{category.id}</div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-white/35 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-5 text-2xl font-semibold tracking-[-0.05em]">{category.name}</div>
                <div className="mt-3 text-sm leading-6 text-white/58">
                  {category.id === 'tech' && 'Deep product thinking, software reactions, camera behavior, ecosystem logic.'}
                  {category.id === 'reviews' && 'Long-form opinions, comparisons, buying guidance, and user-tested verdicts.'}
                  {category.id === 'updates' && 'Firmware drops, launch movement, rollout tracking, and feature reaction.'}
                  {category.id === 'gists' && 'Short notes, clever setups, workflows, and tactical fixes.'}
                  {category.id === 'banter' && 'Hot takes, culture reads, and lower-stakes opinion friction.'}
                  {category.id === 'general' && 'Everything that does not need to be boxed into one lane.'}
                </div>
                <div className="mt-6 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/52">
                  {category.count} live threads
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/38">Flow</div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-[-0.05em]">From curious visitor to core voice.</h2>
              <p className="mt-5 text-base leading-7 text-white/60">
                The landing page should not just look clean. It should explain exactly how the product works, why it exists,
                and what someone gets the second they step into the community.
              </p>
            </div>

            <div className="space-y-4">
              {launchTimeline.map((item, index) => (
                <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[-0.05em]">{item.label}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/60">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#020202_0%,#0a0a0a_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-4xl">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/38">Ready</div>
              <h2 className="mt-4 text-3xl sm:text-6xl font-semibold tracking-[-0.06em] text-balance">
                Enter the cleanest place on the internet to talk about Nothing.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/62">
                Join the people following launches too closely, comparing sound signatures too seriously, and documenting the small product details everyone else misses.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={primaryCTA.action}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
                >
                  <span>{primaryCTA.label}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/reviews')}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
                  <span>Explore Reviews</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-10">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-black" />
                </div>
                <div>
                  <div className="text-lg font-semibold tracking-[-0.05em]">nothing community</div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">Signal-first discussion</div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/55">
                A sharper home for Nothing fans, reviewers, builders, and observers tracking products, software,
                launches, audio, culture, and the details in between.
              </p>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">Explore</div>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                <button onClick={() => navigate('/')} className="block hover:text-white transition-colors">Landing</button>
                <button onClick={() => navigate('/discussions')} className="block hover:text-white transition-colors">Discussions</button>
                <button onClick={() => navigate('/reviews')} className="block hover:text-white transition-colors">Reviews</button>
                <button onClick={() => navigate('/support')} className="block hover:text-white transition-colors">Support</button>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">Community</div>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                <button onClick={() => navigate('/signup')} className="block hover:text-white transition-colors">Create account</button>
                <button onClick={() => navigate('/login')} className="block hover:text-white transition-colors">Sign in</button>
                <button onClick={() => navigate('/new-post')} className="block hover:text-white transition-colors">Write a post</button>
                <button onClick={() => navigate('/profile')} className="block hover:text-white transition-colors">Profile</button>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/35">Focus</div>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-white/55" />
                  <span>Reviews that say something</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-white/55" />
                  <span>Product updates that stay readable</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-white/55" />
                  <span>Community discussion with taste</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-white/30">
            <span>Nothing Community</span>
            <span>Built for signal, taste, and product obsession.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
