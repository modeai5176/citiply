import Image from "next/image";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function AboutPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "About" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-5xl font-semibold">Built for professional material selection</h1>
            <p className="mt-5 text-lg leading-8 text-text-secondary">Citiply brings premium architectural materials into a fast, clear digital catalogue for architects, interior designers, and contractors.</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=82" alt="Premium interior material display" fill sizes="50vw" className="object-cover" />
          </div>
        </div>
        <div className="my-16 grid gap-4 md:grid-cols-4">
          {[["18+", "Years Experience"], ["2,400+", "Product SKUs"], ["42", "Cities Served"], ["8,000+", "Satisfied Clients"]].map(([value, label]) => <div className="rounded-xl border border-border bg-white p-6" key={label}><p className="text-4xl font-semibold text-accent">{value}</p><p className="mt-2 text-text-secondary">{label}</p></div>)}
        </div>
        <div className="relative min-h-[460px] overflow-hidden rounded-xl">
          <Image src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=82" alt="Showroom and factory material display" fill sizes="100vw" className="object-cover" />
        </div>
      </section>
    </>
  );
}
