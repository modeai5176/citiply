"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/projects-data";

gsap.registerPlugin(ScrollTrigger);

export function ProjectsShowcase({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = grid.querySelectorAll(".projects-tile");

    gsap.fromTo(
      items,
      { opacity: 0, y: prefersReducedMotion ? 0 : 40, scale: prefersReducedMotion ? 1 : 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion ? 0.6 : 1.1,
        ease: prefersReducedMotion ? "none" : "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: "top 75%" }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
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
              feature walls. Select a space to explore matched materials, tones and collections.
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

        <div ref={gridRef} className="projects-grid grid gap-4 md:gap-5">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} className={`projects-tile projects-tile-${i}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
