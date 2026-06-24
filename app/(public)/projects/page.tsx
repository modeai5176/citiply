import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/projects-data";

export const metadata = {
  title: "Projects & Applications — Citiply",
  description: "Browse CITIPLY surfaces by design application — residential, hospitality, retail, doors, feature walls and more."
};

export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <Breadcrumb items={[{ label: "Projects" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>
          Browse By Application
        </span>
        <h1 className="text-h2 font-serif" style={{ color: "var(--color-charcoal)" }}>
          Projects &amp; Applications
        </h1>
        <p className="mt-4 max-w-2xl text-text-secondary">
          CITIPLY is a design solutions brand, not just a stock catalogue. Choose a space or element to see
          recommended materials, suitable veneer tones, fluted panels, doors and matching laminates.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} className="rounded-xl" />
          ))}
        </div>
      </section>
    </>
  );
}
