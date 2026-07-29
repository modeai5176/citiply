'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Project } from '@/lib/projects-data';
import { deriveFamiliesUsed } from '@/lib/project-families';

gsap.registerPlugin(ScrollTrigger);

// "Proof, Not Promises" — the portfolio counterpart to Module A's catalogue
// grid. Renders straight off the existing getProjects() data; no fabricated
// photography. Until real completed-project photos are entered in the admin
// panel (project.heroImage, uploaded under projects/{slug}/hero), this reads
// the same seed/placeholder imagery the rest of the /projects area uses today
// — the structure needs zero changes once real photos land.
export function RealProjects({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const featured = projects.slice(0, 4);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tiles = section.querySelectorAll('.project-tile');

    gsap.fromTo(
      tiles,
      { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.5 : 0.8,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 78%' },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, []);

  if (!featured.length) return null;

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--color-beige)' }}
    >
      <div className="content-container">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-eyebrow block mb-3" style={{ color: 'var(--color-gold)' }}>
              Proof, Not Promises
            </span>
            <h2 className="text-h2 font-serif" style={{ color: 'var(--color-charcoal)', maxWidth: '640px' }}>
              Real spaces, real material.
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 self-start text-sm font-sans font-medium md:self-auto"
            style={{ color: 'var(--color-charcoal)' }}
          >
            View all projects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {featured.map((project) => (
            <ProjectTile key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectTile({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const families = deriveFamiliesUsed(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="project-tile group relative block aspect-[4/3] overflow-hidden rounded-sm"
      style={{ opacity: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={project.heroImage}
        alt={project.name}
        fill
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out"
        style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgb(var(--scrim) / 0.82) 0%, rgb(var(--scrim) / 0.2) 50%, transparent 70%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <span className="text-eyebrow" style={{ color: 'var(--color-gold)' }}>{project.category}</span>
        <h3 className="mt-1.5 font-serif text-xl" style={{ color: 'rgb(var(--on-image))' }}>{project.name}</h3>
        <p
          className="mt-2 max-w-md text-sm font-sans opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ color: 'rgb(var(--on-image) / 0.8)' }}
        >
          {project.concept}
        </p>
        {families.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {families.map((family) => (
              <span
                key={family}
                className="rounded-full px-2.5 py-1 text-[11px] font-sans"
                style={{ background: 'rgb(var(--on-image) / 0.14)', color: 'rgb(var(--on-image) / 0.9)' }}
              >
                {family}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
