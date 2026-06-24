"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects-data";

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative block overflow-hidden ${className ?? ""}`}
      style={{ minHeight: "240px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={project.heroImage}
        alt={project.name}
        fill
        className="object-cover transition-transform duration-700 ease-out"
        style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />

      {/* Bottom scrim — same gradient vocabulary as MoodCollections */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgb(var(--scrim) / 0.72) 0%, transparent 55%)" }}
      />

      {/* Hairline gold frame on hover for a touch of identity distinct from mood tiles */}
      <div
        className="pointer-events-none absolute inset-3 transition-opacity duration-500"
        style={{ border: "1px solid rgb(var(--color-gold-rgb) / 0.55)", opacity: isHovered ? 1 : 0 }}
      />

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <span
          className="text-eyebrow block mb-2 transition-all duration-500"
          style={{
            color: "var(--color-gold)",
            opacity: isHovered ? 1 : 0.75,
            transform: isHovered ? "translateY(0)" : "translateY(4px)"
          }}
        >
          {project.category}
        </span>
        <h3 className="font-serif text-lg md:text-xl" style={{ color: "rgb(var(--on-image))" }}>
          {project.name}
        </h3>
        <p
          className="font-sans text-sm mt-1 transition-all duration-500"
          style={{
            color: "rgb(var(--on-image) / 0.78)",
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateY(0)" : "translateY(8px)"
          }}
        >
          {project.concept}
        </p>
      </div>
    </Link>
  );
}
