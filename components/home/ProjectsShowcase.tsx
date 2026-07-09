"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DomeGallery from "@/components/home/DomeGallery";
import type { Project } from "@/lib/projects-data";

gsap.registerPlugin(ScrollTrigger);

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const domeRef = useRef<HTMLDivElement>(null);

  // Collect every project image (hero + gallery) into one de-duplicated pool
  // for the dome tiles.
  const images = useMemo(() => {
    const pool: { src: string; alt: string }[] = [];
    const seen = new Set<string>();
    for (const project of projects) {
      const all = [project.heroImage, ...(project.gallery ?? [])];
      for (const src of all) {
        if (src && !seen.has(src)) {
          seen.add(src);
          pool.push({ src, alt: project.name });
        }
      }
    }
    return pool;
  }, [projects]);

  useEffect(() => {
    const section = sectionRef.current;
    const dome = domeRef.current;
    if (!section || !dome) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const anim = gsap.fromTo(
      dome,
      { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
      {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.6 : 1.1,
        ease: prefersReducedMotion ? "none" : "power3.out",
        scrollTrigger: { trigger: section, start: "top 75%" },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="section-padding" style={{ background: "var(--color-beige)" }}>
      <div className="content-container">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>
              Browse By Application
            </span>
            <h2 className="text-h2 font-serif" style={{ color: "var(--color-charcoal)" }}>
              Designed for real spaces.
            </h2>
            <p className="mt-4 max-w-xl font-sans text-sm" style={{ color: "var(--color-stone)", lineHeight: 1.7 }}>
              See how CITIPLY surfaces solve actual design scenarios — from residences to retail, doors to
              feature walls. Drag to spin the gallery and tap any image to explore it.
            </p>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 self-start text-sm font-sans font-medium transition-colors md:self-auto"
            style={{ color: "var(--color-charcoal)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-charcoal)")}
          >
            View all projects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Interactive dome gallery — draggable sphere of project imagery, in
          original color. Sits full-bleed so the sphere has room to breathe. */}
      <div
        ref={domeRef}
        className="relative mx-auto h-[70vh] min-h-[440px] w-full max-w-[1600px] overflow-hidden"
        style={{ background: "rgb(var(--scrim))", borderRadius: "24px" }}
      >
        <DomeGallery
          images={images}
          grayscale={false}
          overlayBlurColor="rgb(var(--scrim))"
          imageBorderRadius="16px"
          openedImageBorderRadius="16px"
          fit={0.55}
        />
      </div>
    </section>
  );
}
