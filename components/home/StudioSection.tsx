'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Facebook, Instagram, Play, Youtube } from 'lucide-react';
import {
  FEATURED_EPISODE,
  INSTAGRAM,
  SOCIAL_CHANNELS,
  STUDIO_SHORTS,
  type ShortCategory,
  type SocialChannel,
  type StudioShort,
} from '@/lib/studio-content';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<SocialChannel['platform'], typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Muted looping video. `mode="view"` plays whenever it's on screen; `mode="hover"`
 * plays on hover for mouse users and falls back to on-screen playback on touch.
 * Never plays under reduced motion — the poster stays up instead.
 */
function LoopVideo({
  src,
  poster,
  mode = 'view',
  hovered = false,
  className,
}: {
  src: string;
  poster: string;
  mode?: 'view' | 'hover';
  hovered?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const shouldPlay = !reduceMotion && inView && (mode === 'view' || !canHover || hovered);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (shouldPlay) {
      video.preload = 'auto';
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay]);

  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />;
}

function FeaturedEpisode() {
  const episode = FEATURED_EPISODE;

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <a
        href={episode.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block aspect-video overflow-hidden bg-black"
        aria-label={`Watch the full episode on YouTube: ${episode.title}`}
      >
        <LoopVideo src={episode.highlights} poster={episode.poster} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.55)] via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--scrim)/0.6)] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[rgb(var(--on-image))] backdrop-blur sm:left-4 sm:top-4">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          Highlights
        </span>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-[rgb(var(--on-image))] shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
            <Play className="ml-1 h-6 w-6 fill-current lg:h-7 lg:w-7" aria-hidden="true" />
          </span>
        </span>
        <span className="absolute bottom-3 right-3 rounded bg-[rgb(var(--scrim)/0.75)] px-2 py-0.5 text-xs text-[rgb(var(--on-image))] sm:bottom-4 sm:right-4">{episode.duration}</span>
      </a>

      <div className="flex flex-col justify-between gap-6 p-5 sm:p-7 lg:p-8">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-accent">
            <Youtube className="h-3.5 w-3.5" aria-hidden="true" />
            {episode.series} · {episode.episode}
          </p>
          <h3 className="mt-3 font-serif text-2xl leading-tight text-text-primary sm:text-[1.75rem]">{episode.title}</h3>
          {episode.guest ? <p className="mt-2 text-sm text-text-secondary">with {episode.guest}</p> : null}
          {episode.description ? <p className="mt-4 text-sm leading-relaxed text-text-muted">{episode.description}</p> : null}
        </div>
        <a
          href={episode.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-[rgb(var(--on-image))] transition hover:bg-[var(--accent-hover)] sm:w-auto sm:self-start"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          Watch full episode · {episode.duration}
        </a>
      </div>
    </div>
  );
}

function ShortCard({ item }: { item: StudioShort }) {
  const [hovered, setHovered] = useState(false);
  const SourceIcon = item.source === 'youtube' ? Youtube : Instagram;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group relative aspect-[9/16] w-[44vw] max-w-[15rem] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-surface sm:w-52 lg:w-56"
    >
      <LoopVideo src={item.video} poster={item.poster} mode="hover" hovered={hovered} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.85)] via-transparent to-[rgb(var(--scrim)/0.25)]" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-[rgb(var(--scrim)/0.55)] px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[rgb(var(--on-image))] backdrop-blur">
        {item.category}
      </span>
      <SourceIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-[rgb(var(--on-image))] opacity-80" aria-label={item.source === 'youtube' ? 'YouTube Short' : 'Instagram Reel'} />
      <p className="absolute inset-x-0 bottom-0 p-3 text-[0.8rem] font-medium leading-snug text-[rgb(var(--on-image))] sm:text-sm">{item.title}</p>
    </a>
  );
}

function ShortsRail() {
  const categories = useMemo(() => ['All', ...Array.from(new Set(STUDIO_SHORTS.map((item) => item.category)))] as Array<'All' | ShortCategory>, []);
  const [category, setCategory] = useState<'All' | ShortCategory>('All');
  const items = STUDIO_SHORTS.filter((item) => category === 'All' || item.category === category);
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  function updateEdges() {
    const rail = railRef.current;
    if (!rail) return;
    setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
  }

  useEffect(() => {
    railRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [category]);

  function scrollBy(direction: 1 | -1) {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <div className="mt-14 md:mt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl text-text-primary">Shorts & Reels</h3>
          <p className="mt-1 text-sm text-text-muted">Quick looks at the showroom, materials and the people behind them.</p>
        </div>
        <div className="hidden gap-2 md:flex">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => scrollBy(direction)}
              disabled={direction === -1 ? edges.start : edges.end}
              aria-label={direction === -1 ? 'Scroll left' : 'Scroll right'}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-border text-text-primary transition hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-primary"
            >
              {direction === -1 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-[clamp(1.25rem,4vw,3rem)] mt-5 flex gap-2 overflow-x-auto px-[clamp(1.25rem,4vw,3rem)] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter shorts by category">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={category === item}
            onClick={() => setCategory(item)}
            className={cn(
              'relative shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors',
              category === item ? 'border-accent text-[rgb(var(--on-image))]' : 'border-border text-text-secondary hover:border-[rgb(var(--color-stone-rgb)/0.6)] hover:text-text-primary'
            )}
          >
            {category === item ? <motion.span layoutId="studio-category" className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 34 }} /> : null}
            <span className="relative">{item}</span>
          </button>
        ))}
      </div>

      <div
        ref={railRef}
        onScroll={updateEdges}
        className="-mx-[clamp(1.25rem,4vw,3rem)] mt-5 flex snap-x snap-mandatory scroll-px-[clamp(1.25rem,4vw,3rem)] gap-3 overflow-x-auto px-[clamp(1.25rem,4vw,3rem)] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => <ShortCard item={item} key={item.id} />)}
      </div>
    </div>
  );
}

function ChannelCard({ channel, index }: { channel: SocialChannel; index: number }) {
  const Icon = PLATFORM_ICONS[channel.platform];
  return (
    <motion.a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent sm:p-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-text-primary transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-[rgb(var(--on-image))]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">{channel.label} <span className="font-normal text-text-muted">{channel.handle}</span></span>
        <span className="block truncate text-xs text-text-muted">{channel.blurb}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
    </motion.a>
  );
}

export function StudioSection() {
  return (
    <section className="overflow-hidden border-t border-border py-[var(--section-py)]" style={{ background: 'var(--color-ivory)' }} aria-labelledby="studio-heading">
      <div className="content-container">
        <motion.div
          className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div>
            <p className="text-eyebrow text-accent">Citiply Studio</p>
            <h2 id="studio-heading" className="text-h2 mt-3 max-w-xl text-text-primary">Conversations on material, craft and space</h2>
          </div>
          <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer" className="cta-underline self-start whitespace-nowrap text-sm md:self-auto" style={{ color: 'var(--color-gold)' }}>
            Follow {INSTAGRAM.handle} <span aria-hidden="true">→</span>
          </a>
        </motion.div>

        <FeaturedEpisode />
        <ShortsRail />

        <div className="mt-14 grid gap-3 md:mt-16 lg:grid-cols-3">
          {SOCIAL_CHANNELS.map((channel, index) => <ChannelCard channel={channel} index={index} key={channel.platform} />)}
        </div>
      </div>
    </section>
  );
}
