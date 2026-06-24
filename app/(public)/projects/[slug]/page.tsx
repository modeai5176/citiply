import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Headset } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { getProjectBySlug, getProjects, type ProjectChip } from "@/lib/projects-data";

const WHATSAPP_NUMBER = "919136460666";

function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};
  return {
    title: `${project.name} — Citiply Projects`,
    description: project.concept
  };
}

function Chip({ chip }: { chip: ProjectChip }) {
  const base =
    "inline-flex items-center rounded-full border px-4 py-2 text-sm transition";
  if (chip.href) {
    return (
      <Link
        href={chip.href}
        className={`${base} border-accent/40 bg-accent/5 text-accent hover:border-accent hover:bg-accent hover:text-[rgb(var(--on-image))]`}
      >
        {chip.label}
      </Link>
    );
  }
  return <span className={`${base} border-border bg-surface text-text-secondary`}>{chip.label}</span>;
}

function SpecBlock({ title, chips }: { title: string; chips: ProjectChip[] }) {
  if (!chips.length) return null;
  return (
    <div className="rounded-xl border border-border bg-ivory p-6">
      <span className="text-eyebrow block mb-4" style={{ color: "var(--color-gold)" }}>
        {title}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {chips.map((chip) => (
          <Chip chip={chip} key={chip.label} />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  return (
    <>
      <Breadcrumb items={[{ label: "Projects", href: "/projects" }, { label: project.name }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Hero — shares the category/[slug] hero vocabulary */}
        <div className="relative min-h-[48vh] overflow-hidden rounded-xl bg-dark">
          <Image src={project.heroImage} alt={project.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--scrim)/0.72)] via-[rgb(var(--scrim)/0.28)] to-[rgb(var(--scrim)/0.05)]" />
          <div className="absolute bottom-0 max-w-2xl p-8 text-[rgb(var(--on-image))]">
            <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--color-gold-rgb))]">{project.category}</p>
            <h1 className="mt-3 text-5xl font-semibold">{project.name}</h1>
            <p className="mt-4 text-xl text-[rgb(var(--on-image)/0.82)]">{project.concept}</p>
          </div>
        </div>

        {/* Gallery — asymmetric: one large + two stacked */}
        {project.gallery.length ? (
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            {project.gallery.slice(0, 3).map((src, i) => (
              <div
                key={src}
                className={`group relative overflow-hidden rounded-xl bg-surface ${
                  i === 0 ? "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={src}
                  alt={`${project.name} application ${i + 1}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* Spec blocks */}
        <div className="mt-12">
          <span className="text-eyebrow block mb-2" style={{ color: "var(--color-stone)" }}>
            The Specification
          </span>
          <h2 className="text-h3 font-serif mb-8" style={{ color: "var(--color-charcoal)" }}>
            What works in this space.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SpecBlock title="Recommended Materials" chips={project.recommendedMaterials} />
            <SpecBlock title="Suitable Veneer Tones & Collections" chips={project.veneerTones} />
            <SpecBlock title="Fluted Panel Options" chips={project.flutedPanels} />
            <SpecBlock title="Door Options" chips={project.doors} />
            <SpecBlock title="Matching Laminates / Flooring" chips={project.laminates} />
          </div>
        </div>

        {/* CTA strip — consistent with the collection page (Change 2) */}
        <div className="mt-12 grid gap-4 rounded-xl border border-border bg-ivory p-6 sm:grid-cols-2">
          <a
            href={whatsappLink(`Hi, I'd like material recommendations for a ${project.name} project.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition hover:border-accent"
          >
            <Headset className="h-6 w-6 text-accent" />
            <div>
              <p className="font-medium">Talk to a Material Specialist</p>
              <p className="text-sm text-text-muted">Get tailored guidance for your {project.name.toLowerCase()} project.</p>
            </div>
          </a>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-5">
            <div>
              <p className="font-medium">Start a project enquiry</p>
              <p className="text-sm text-text-muted">Share your spec and we&apos;ll respond with options.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button href="/quote">Enquire</Button>
              <Button variant="ghost" href={whatsappLink(`Hi, I'm planning a ${project.name} project with CITIPLY.`)} target="_blank">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
