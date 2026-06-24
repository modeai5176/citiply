import Image from "next/image";
import { notFound } from "next/navigation";
import { Download, FileText, MessageCircle, Headset } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CollectionExplorer } from "@/components/catalogue/CollectionExplorer";
import { CollectionCard } from "@/components/catalogue/CollectionCard";
import { RequestSampleButton } from "@/components/catalogue/RequestSampleButton";
import { Button } from "@/components/ui/Button";
import { getCategories, getCollectionBySlug, getCollections, getProducts } from "@/lib/catalogue-data";

export const revalidate = 3600;

const WHATSAPP_NUMBER = "919136460666";

function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default async function CollectionListingPage({ params }: { params: { slug: string } }) {
  const collection = await getCollectionBySlug(params.slug, true);
  if (!collection) notFound();
  const [categories, listing, related] = await Promise.all([
    getCategories(),
    getProducts({ collectionId: collection.id, limit: 24 }),
    getCollections({ categoryId: collection.categoryId, withCounts: true })
  ]);
  const category = categories.find((item) => item.id === collection.categoryId);
  const relatedVeneers = related.filter((item) => item.id !== collection.id).slice(0, 3);
  const hasBrochure = collection.brochureUrl !== "#";

  return (
    <>
      <Breadcrumb
        items={[
          ...(category?.catalogueName && category.catalogueSlug ? [{ label: category.catalogueName, href: `/catalogues/${category.catalogueSlug}` }] : []),
          { label: category?.name ?? "Category", href: category ? `/categories/${category.slug}` : undefined },
          { label: collection.name }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative mb-10 min-h-[50vh] overflow-hidden rounded-xl bg-dark">
          <Image src={collection.bannerUrl} alt={collection.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--scrim)/0.72)] via-[rgb(var(--scrim)/0.28)] to-[rgb(var(--scrim)/0.05)]" />
          <div className="absolute bottom-0 max-w-2xl p-8 text-[rgb(var(--on-image))]">
            <p className="text-sm uppercase tracking-[0.24em] text-[rgb(var(--on-image)/0.6)]">{category?.name}</p>
            <h1 className="mt-3 text-5xl font-semibold">{collection.name}</h1>
            <p className="mt-4 text-xl text-[rgb(var(--on-image)/0.8)]">{collection.tagline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {hasBrochure ? (
                <Button href={collection.brochureUrl} target="_blank">
                  <FileText className="h-4 w-4" /> Collection PDF
                </Button>
              ) : null}
              <RequestSampleButton collectionName={collection.name} />
              <Button variant="ghost" href={whatsappLink(`Hi, I'd like to know more about the ${collection.name} veneer collection.`)} target="_blank">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>

        <CollectionExplorer products={listing} />

        <div className="mt-16 border-t border-border pt-12">
          {relatedVeneers.length ? (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold">Related Veneers</h2>
              <p className="mt-1 text-text-secondary">Other collections in {category?.name ?? "this range"} you may want to pair.</p>
              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {relatedVeneers.map((item) => (
                  <CollectionCard collection={item} key={item.id} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 rounded-xl border border-border bg-ivory p-6 sm:grid-cols-2">
            {hasBrochure ? (
              <a
                href={collection.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition hover:border-accent"
              >
                <Download className="h-6 w-6 text-accent" />
                <div>
                  <p className="font-medium">Downloadable Spec Sheet</p>
                  <p className="text-sm text-text-muted">Full technical specifications for {collection.name}.</p>
                </div>
              </a>
            ) : null}
            <a
              href={whatsappLink(`Hi, I'd like to speak to a material specialist about the ${collection.name} collection.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition hover:border-accent"
            >
              <Headset className="h-6 w-6 text-accent" />
              <div>
                <p className="font-medium">Talk to a Material Specialist</p>
                <p className="text-sm text-text-muted">Get tailored guidance on species, finish, and application.</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
