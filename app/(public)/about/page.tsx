import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { getCatalogues } from "@/lib/catalogue-data";

export const revalidate = 300;

export const metadata = {
  title: "About CITIPLY — Three generations, 75+ years of grain",
  description:
    "The CITIPLY story: 75+ years across three generations, a curated approach to veneers and surfaces, and a sourcing-to-finishing philosophy built for architects and designers."
};

const WHATSAPP_NUMBER = "919136460666";
function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const STATS: Array<[string, string]> = [
  ["75+", "Years in business"],
  ["3", "Generations"],
  ["Pan-India", "Markets served"],
  ["Architects", "& designers first"]
];

const TIMELINE: Array<{ era: string; title: string; body: string }> = [
  {
    era: "First generation",
    title: "A timber trade is founded",
    body: "The business began over seventy-five years ago in the timber and plywood trade — built on relationships with mills, an eye for grain, and a reputation for never compromising on what left the door."
  },
  {
    era: "Second generation",
    title: "From timber to surfaces",
    body: "As interiors evolved, so did we — moving from raw material into decorative veneers, panels and engineered surfaces, and deepening direct sourcing relationships across species and regions."
  },
  {
    era: "Third generation",
    title: "A curated material house",
    body: "Today CITIPLY operates as a curated surfaces house: selecting, finishing and value-adding a tightly edited range for architects and designers who want to specify with confidence, not wade through a warehouse."
  }
];

const PILLARS: Array<{ label: string; title: string; body: string }> = [
  {
    label: "Sourcing",
    title: "Selected at origin",
    body: "Long-standing relationships let us choose logs and flitches at source — for grain character, consistency and yield, not just price."
  },
  {
    label: "Craftsmanship",
    title: "Worked by hand and eye",
    body: "Matching, sequencing and layup are done by people who have handled veneer their whole lives, so every sheet reads as part of one story."
  },
  {
    label: "Finishing",
    title: "Finished to specification",
    body: "Tones, sheens and protective finishes are tuned to how a surface will actually be used — residential warmth to high-traffic durability."
  },
  {
    label: "Value addition",
    title: "Ready to specify",
    body: "Matched doors, fluted panels, laminates and flooring are prepared to pair with our veneers, so a scheme arrives coordinated, not assembled by chance."
  }
];

const MARKETS = ["Residential", "Hospitality", "Corporate / Office", "Retail", "Public & reception spaces"];

const SUPPORT: Array<{ title: string; body: string }> = [
  { title: "Showroom", body: "Experience full-size veneers, panels and finishes in person, under considered light — the way a material should be specified." },
  { title: "Warehouse", body: "Held stock and sequenced flitches mean availability and continuity across a project, not one-off sheets." },
  { title: "Sample support", body: "Physical samples and spec sheets sent to studios so the decision happens on the desk, with the real material in hand." },
  { title: "Specialist team", body: "A team that knows the range intimately and helps match species, tone and finish to the brief." }
];

export default async function AboutPage() {
  const catalogues = await getCatalogues();

  return (
    <>
      <Breadcrumb items={[{ label: "About" }]} />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Hero — shares the scrim hero vocabulary used across the site */}
        <div className="relative min-h-[52vh] overflow-hidden rounded-xl bg-dark">
          <Image src="/images/sections/architect-mode.png" alt="CITIPLY heritage in material" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--scrim)/0.74)] via-[rgb(var(--scrim)/0.3)] to-[rgb(var(--scrim)/0.05)]" />
          <div className="absolute bottom-0 max-w-3xl p-8 text-[rgb(var(--on-image))]">
            <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--color-gold-rgb))]">Our Story</p>
            <h1 className="mt-3 font-serif text-4xl leading-[1.05] sm:text-5xl md:text-6xl">Three generations.<br />75+ years of grain.</h1>
            <p className="mt-5 text-lg text-[rgb(var(--on-image)/0.82)]">
              CITIPLY is a family material house — a tightly curated range of veneers and surfaces, sourced, finished and value-added for the people who specify them.
            </p>
          </div>
        </div>

        {/* Heritage stats */}
        <div className="my-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div className="rounded-xl border border-border bg-ivory p-6" key={label}>
              <p className="font-serif text-4xl text-accent">{value}</p>
              <p className="mt-2 text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How the business evolved — timeline on beige band */}
      <section className="section-padding" style={{ background: "var(--color-beige)" }}>
        <div className="content-container">
          <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>How we evolved</span>
          <h2 className="text-h2 font-serif mb-12" style={{ color: "var(--color-charcoal)" }}>From timber yard to curated surfaces.</h2>
          <div className="heritage-timeline grid gap-10">
            {TIMELINE.map((node) => (
              <div className="heritage-node" key={node.era}>
                <span className="text-eyebrow block mb-2" style={{ color: "var(--color-gold)" }}>{node.era}</span>
                <h3 className="font-serif text-xl md:text-2xl" style={{ color: "var(--color-charcoal)" }}>{node.title}</h3>
                <p className="mt-3 max-w-2xl font-sans text-sm" style={{ color: "var(--color-stone)", lineHeight: 1.7 }}>{node.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes our curation different — charcoal band, text + image */}
      <section className="section-padding" style={{ background: "var(--color-charcoal)" }}>
        <div className="content-container">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
            <div className="w-full md:w-1/2">
              <span className="text-eyebrow block mb-4" style={{ color: "var(--color-gold)" }}>What makes us different</span>
              <h2 className="text-h3 font-serif mb-6" style={{ color: "var(--color-ivory)" }}>Curation, not a catalogue.</h2>
              <p className="font-sans" style={{ color: "rgb(var(--color-ivory-rgb) / 0.68)", fontSize: "var(--text-body)", lineHeight: 1.7 }}>
                Most suppliers sell everything and let you sort it out. We do the opposite. Three generations of handling
                material let us edit hard — keeping the species, grains and finishes that perform and pairing them with
                matched doors, panels and laminates. The result is a range you can specify from, where every option has
                already earned its place.
              </p>
              <Link
                href="/projects"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-sans font-medium"
                style={{ color: "var(--color-gold)" }}
              >
                See it applied in real spaces
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl md:w-1/2">
              <Image src="/images/sections/room-discovery.png" alt="Curated CITIPLY surfaces in an interior" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Quality philosophy — craft pillars */}
      <section className="section-padding" style={{ background: "var(--color-ivory)" }}>
        <div className="content-container">
          <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>Our quality philosophy</span>
          <h2 className="text-h2 font-serif mb-12" style={{ color: "var(--color-charcoal)" }}>Sourcing to finishing, owned end to end.</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => (
              <div className="rounded-xl border border-border bg-surface p-6" key={pillar.label}>
                <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>{pillar.label}</span>
                <h3 className="font-serif text-lg" style={{ color: "var(--color-charcoal)" }}>{pillar.title}</h3>
                <p className="mt-3 font-sans text-sm" style={{ color: "var(--color-stone)", lineHeight: 1.7 }}>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets & audience + capabilities */}
      <section className="section-padding" style={{ background: "var(--color-beige)" }}>
        <div className="content-container grid gap-12 lg:grid-cols-2">
          <div>
            <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>Who we serve</span>
            <h2 className="text-h3 font-serif mb-5" style={{ color: "var(--color-charcoal)" }}>Built around architects &amp; designers.</h2>
            <p className="font-sans text-sm" style={{ color: "var(--color-stone)", lineHeight: 1.7 }}>
              We work the way studios work — spec sheets, samples and matched options — across the markets where surface
              and detail matter most.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {MARKETS.map((market) => (
                <span key={market} className="inline-flex items-center rounded-full border border-border bg-ivory px-4 py-2 text-sm text-text-secondary">{market}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>Categories &amp; capabilities</span>
            <h2 className="text-h3 font-serif mb-5" style={{ color: "var(--color-charcoal)" }}>What we make and supply.</h2>
            {catalogues.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {catalogues.map((catalogue) => (
                  <Link
                    key={catalogue.id}
                    href={`/catalogues/${catalogue.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-ivory px-4 py-3 transition hover:border-accent"
                  >
                    <span className="font-sans text-sm font-medium" style={{ color: "var(--color-charcoal)" }}>{catalogue.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Product families are being prepared.</p>
            )}
          </div>
        </div>
      </section>

      {/* Showroom / warehouse / sample / team support */}
      <section className="section-padding" style={{ background: "var(--color-ivory)" }}>
        <div className="content-container">
          <span className="text-eyebrow block mb-3" style={{ color: "var(--color-gold)" }}>How we support you</span>
          <h2 className="text-h2 font-serif mb-12" style={{ color: "var(--color-charcoal)" }}>Showroom, stock and people behind every spec.</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPORT.map((item) => (
              <div className="rounded-xl border border-border bg-surface p-6" key={item.title}>
                <h3 className="font-serif text-lg" style={{ color: "var(--color-charcoal)" }}>{item.title}</h3>
                <p className="mt-3 font-sans text-sm" style={{ color: "var(--color-stone)", lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>

          {/* CTA strip — consistent with collection & project pages */}
          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-xl border border-border bg-ivory p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-serif text-xl" style={{ color: "var(--color-charcoal)" }}>Come and feel the material.</p>
              <p className="mt-1 text-sm text-text-muted">Visit the showroom, request samples, or speak to a material specialist.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button href="/contact">Visit / Contact</Button>
              <Button variant="ghost" href={whatsappLink("Hi, I'd like to know more about CITIPLY and your range.")} target="_blank">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
