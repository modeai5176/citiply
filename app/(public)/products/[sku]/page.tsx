import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ImageGallery } from "@/components/catalogue/ImageGallery";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductCodeBadge } from "@/components/ui/ProductCodeBadge";
import { AddToEnquiryButton } from "@/components/enquiry/AddToEnquiryButton";
import { getCategories, getCollections, getProductBySku, getProducts, getProductStaticParams } from "@/lib/catalogue-data";
import { ProductQuoteButton } from "./product-quote-button";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getProductStaticParams();
}

export default async function ProductDetailPage({ params }: { params: { sku: string } }) {
  const product = await getProductBySku(params.sku);
  if (!product) notFound();
  const [categories, collections, related] = await Promise.all([
    getCategories(),
    getCollections(),
    getProducts({ collectionId: product.collectionId, excludeId: product.id, limit: 4 })
  ]);
  const collection = collections.find((item) => item.id === product.collectionId);
  const category = categories.find((item) => item.id === product.categoryId);

  return (
    <>
      <Breadcrumb
        items={[
          ...(category?.catalogueName && category.catalogueSlug ? [{ label: category.catalogueName, href: `/catalogues/${category.catalogueSlug}` }] : []),
          { label: category?.name ?? "Category", href: category ? `/categories/${category.slug}` : undefined },
          { label: collection?.name ?? "Collection", href: collection ? `/collections/${collection.slug}` : undefined },
          { label: product.sku }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
          <ImageGallery images={product.images} />
          <div>
            <ProductCodeBadge code={product.sku} className="text-sm" />
            <h1 className="mt-5 text-5xl font-semibold">{product.name}</h1>
            {collection ? <Link className="mt-4 inline-flex text-accent" href={`/collections/${collection.slug}`}>{collection.name}</Link> : null}
            <p className="mt-5 text-text-secondary">{product.shortDescription}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Finish", product.finish],
                ["Base Material", product.baseMaterial],
                ["Size", product.size],
                ["Thickness", product.thickness],
                ["Color Tone", product.colorTone]
              ].map(([name, value]) => (
                <div className="rounded-lg border border-border bg-ivory p-4" key={name}>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{name}</p>
                  <p className="mt-2 font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {product.applications.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {product.brochureUrl !== "#" ? <Button href={product.brochureUrl} target="_blank"><Download className="h-4 w-4" /> Download Brochure</Button> : null}
              <ProductQuoteButton product={{ sku: product.sku, name: product.name, finish: product.finish, colorTone: product.colorTone, imageUrl: product.images[0]?.thumbnailUrl }} />
            </div>
            <div className="mt-3 max-w-xs">
              <AddToEnquiryButton product={product} variant="detail" />
            </div>
          </div>
        </div>
        <div className="mt-16">
          <h2 className="text-3xl font-semibold">Technical Specs</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-ivory">
            {product.specs.map((spec) => (
              <div className="grid grid-cols-2 border-b border-border last:border-0" key={spec.name}>
                <div className="bg-surface p-4 text-sm font-medium">{spec.name}</div>
                <div className="p-4 text-sm text-text-secondary">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16">
          <h2 className="mb-6 text-3xl font-semibold">Related Products</h2>
          <ProductGrid products={related} />
        </div>
      </section>
    </>
  );
}
